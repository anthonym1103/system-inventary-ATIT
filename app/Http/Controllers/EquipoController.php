<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use App\Models\HistorialEquipo;
use App\Models\Infraestructura;
use App\Models\Rede;
use App\Models\Transmision;
use App\Models\Ubicacion;
use App\Models\UserAsignado;
use App\Enums\Area;
use App\Enums\TipoEquipo;
use App\Enums\CondicionEquipo;
use App\Enums\EstadoRegion;
use App\Enums\Cargo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Collection;

class EquipoController extends Controller
{
    
    public function index(Request $request){
        $user = Auth::user();
        
        // 1. Determinar áreas permitidas (igual que en DashboardController)
        $allowedAreas = $this->getUserAllowedAreas($user);
        $relacionEquipo = $this->getRelacionEquipo($allowedAreas);
    
        // 2. Query base con filtro de áreas
        $query = Equipo::query()
            ->with(array_merge(['ubicacion', 'userAsignado'], $relacionEquipo))
            ->when(!$user->hasRole(Cargo::ADMINISTRADOR->value) && !empty($allowedAreas), function ($q) use ($allowedAreas) {
                $q->whereIn('area', $allowedAreas);
            });
        
        // 3. Búsqueda por texto (serial, marca, modelo, tipo)
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('serial', 'ILIKE', "%{$search}%")
                  ->orWhere('marca', 'ILIKE', "%{$search}%")
                  ->orWhere('modelo', 'ILIKE', "%{$search}%")
                  ->orWhere('tipo', 'ILIKE', "%{$search}%");
            });
        }
        
        // 4. Filtros adicionales (por tipo, condición, ubicación)
        if ($request->filled('tipo') && $request->input('tipo') !== 'all') {
            $query->where('tipo', $request->input('tipo'));
        }
        if ($request->filled('condicion') && $request->input('condicion') !== 'all') {
            $query->where('condicion', $request->input('condicion'));
        }
        if($request->filled('estado_region') && $request->input('estado_region') !== 'all'){
            $estadosBuscados = $request->input('estado_region');

            $query->whereHas('ubicacion', function($q) use ($estadosBuscados){
                $q->where('estado', $estadosBuscados);
            });
        }
       
        // 5. Paginación (10 por página, puedes cambiar)
        $equipos = $query->latest()->paginate(10)->withQueryString();

        // 6. Datos para filtros (tipos, condiciones, ubicaciones)
        $tiposLabels = [];
        foreach (TipoEquipo::cases() as $tipo) {
            if(count($allowedAreas) === 1 || in_array($tipo->modulo()->value, $allowedAreas)){
                $tiposLabels[$tipo->value] = $tipo->label();
            }else{
                foreach($allowedAreas as $area){
                    if($tipo->modulo()->value === $area){
                        $tiposLabels[$tipo->value] = $tipo->label();
                    }
                }
            }
        }

        $estadosLabels = [];
        foreach (EstadoRegion::cases() as $estado) {
            $estadosLabels[$estado->value] = $estado->label();
        }

        // Solo mostrar ubicaciones que tengan equipos en las áreas permitidas
        $ubicacionesCargadas = Ubicacion::whereHas('equipos', function ($q) use ($allowedAreas, $user) {
            if (!$user->hasRole(Cargo::ADMINISTRADOR->value) && !empty($allowedAreas)) {
                $q->whereIn('area', $allowedAreas);
            }
        })->get(['id', 'estado']);

        $ubicaciones = $this->getEstadosRegion();

        
        // 7. Obtener permisos del usuario para acciones (opcional)
        $permissions = [
            'can_create' => $user->can('crear_equipos'),
            'can_edit'   => $user->can('editar_equipos'),
            'can_delete' => $user->can('eliminar_equipos'),
            'can_viewHistorial'=> $user->can('ver_historial'),
            'can_asigRoles' => $user->can('asignar_roles'),
        ];

        $condiciones = collect(CondicionEquipo::cases())->map(fn($case) => [
            'value' => $case->value,
            'label' => $case->value === 'Operativo' ? 'Operativo' : 'No operativo',
        ])->values();

        return Inertia::render('equipos/index', [
            'equipos' => $equipos,
            'tiposLabels' => $tiposLabels,
            'estadosLabels' => $estadosLabels,
            'condiciones' => $condiciones,
            'ubicaciones' => $ubicaciones,
            'filters' => $request->only(['search', 'tipo', 'condicion', 'ubicacion_id']),
            'permissions' => $permissions,
        ]);

    }

    public function create()
    {
        $user = Auth::user();
        abort_unless($user->can('crear_equipos'), 403);

        $allowedAreas = $this->getUserAllowedAreas($user);

        $tiposLabels = [];
        $camposPorTipo = [];

        foreach (TipoEquipo::cases() as $tipo) {
            if (!in_array($tipo->modulo()->value, $allowedAreas)) {
                continue;
            }

            $tiposLabels[$tipo->value] = $tipo->label();
            $camposPorTipo[$tipo->value] = [
                'area' => $tipo->modulo()->value,
                'campos' => $tipo->camposEspecificos(),
                'requiereEncargado' => $tipo->requiereEncargado(),
            ];
        }

        $ubicacionesCompletas = Ubicacion::orderBy('locacion')->get(['id', 'estado', 'locacion']);
        $ubicaciones = $this->getEstadosRegion();

        return Inertia::render('equipos/create', [
            'tiposLabels' => $tiposLabels,
            'camposPorTipo' => $camposPorTipo,
            'ubicaciones' => $ubicaciones,
            'asignados' => UserAsignado::orderBy('nombre')->get(['cedula', 'nombre', 'apellido']),
        ]);
    }
  
    public function store(Request $request)
    {
        $user = Auth::user();
        abort_unless($user->can('crear_equipos'), 403);

        $tipo = TipoEquipo::tryFrom((string) $request->input('tipo'));

        if (! $tipo) {
            return back()->withErrors(['tipo' => 'Debes seleccionar un tipo de equipo válido.'])->withInput();
        }

        $allowedAreas = $this->getUserAllowedAreas($user);

        if (!in_array($tipo->modulo()->value, $allowedAreas)) {
            abort(403, 'No tienes permiso para crear equipos de esta área.');
        }

        $camposEspecificos = $tipo->camposEspecificos();
        $requiereEncargado = $tipo->requiereEncargado();

        $rules = [
            'tipo' => ['required', Rule::in(array_column(TipoEquipo::cases(), 'value'))],
            'estados' => ['required', Rule::in(array_column(EstadoRegion::cases(), 'value'))],
            'locacions' => ['nullable', 'string', 'max:255'],
            'marca' => ['nullable', 'string', 'max:255'],
            'modelo' => ['required', 'string', 'max:255'],
            'serial' => ['required', 'string', 'max:255', 'unique:equipos,serial'],
            'detalle' => ['nullable', 'string'],
            'asignado_id' => $requiereEncargado
                ? ['required', 'string', 'exists:user_asignados,cedula']
                : ['prohibited'],
        ];

        // Reglas por campo específico de la tabla del área correspondiente.
        $reglasCampos = [
            'anio' => ['nullable', 'digits:4'],
            'ram' => ['required', 'string', 'max:50'],
            'disco' => ['required', 'string', 'max:100'],
            'direccion_mac' => ['required', 'string', 'regex:/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/'],
            'sistema_operativo' => ['required', 'string', 'max:100'],
            'numero_inventario' => ['required', 'string', 'max:100'],
            'dominio' => ['nullable', 'string', 'max:255'],
            'puerto' => ['required', 'string', 'max:50'],
            'contraseña_bios' => ['required', 'string', 'min:4'],
            'direccion_ip' => ['required', 'ip'],
            'extension' => ['required', 'string', 'max:50'],
            'ubicacion_puerto' => ['required', 'string', 'max:100'],
            'potencia' => ['required', 'string', 'max:50'],
            'rango_frecuencia' => ['required', 'string', 'max:100'],
            'unidad_usuario' => ['required', 'string', 'max:255'],
            'caracteristicas' => ['nullable', 'string'],
        ];

        foreach ($camposEspecificos as $campo) {
            $rules[$campo] = $reglasCampos[$campo] ?? ['nullable', 'string', 'max:255'];
        }

        $validated = $request->validate($rules);

        DB::transaction(function () use ($validated, $tipo, $camposEspecificos) {
            $ubicacion = Ubicacion::firstOrCreate([
                    'estado' => $validated['estados'],
                    'locacion' => $validated['locacions'],
                ]);

            $equipo = Equipo::create([
                'ubicacion_id' => $ubicacion->id,
                'asignado_id' => $validated['asignado_id'] ?: null,
                'area' => $tipo->modulo()->value,
                'tipo' => $tipo->value,
                'marca' => $validated['marca'] ?: null,
                'modelo' => $validated['modelo'],
                'serial' => $validated['serial'],
                'detalle' => $validated['detalle'] ?: null,
            ]);

            // Solo nos quedamos con los campos que aplican a este tipo.
            $datosEspecificos = collect($validated)->only($camposEspecificos)->toArray();

            if (array_key_exists('contraseña_bios', $datosEspecificos)) {
                $datosEspecificos['contraseña_bios'] = Hash::make($datosEspecificos['contraseña_bios']);
            }

            $modeloEspecifico = match ($tipo->modulo()) {
                Area::INFRAESTRUCTURA => Infraestructura::class,
                Area::REDES => Rede::class,
                Area::TRANSMISION => Transmision::class,
            };

            // forceFill + asignación manual del id porque estas tablas
            // usan el id de "equipos" como PK compartida y no es fillable.
            $registro = new $modeloEspecifico();
            $registro->forceFill($datosEspecificos);
            $registro->id = $equipo->id;
            $registro->save();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Equipo creado correctamente.']);

        return to_route('equipos.index');        
    }

    public function edit(Equipo $equipo)
    {
        $this->authorizeEdit($equipo);

        return Inertia::render('equipos/edit', $this->buildEditData($equipo));
    }

    public function editData(Equipo $equipo)
    {
        $this->authorizeEdit($equipo);

        return response()->json($this->buildEditData($equipo));
    }

    private function authorizeEdit(Equipo $equipo): void
    {
        $user = Auth::user();
        abort_unless($user->can('editar_equipos'), 403);

        $allowedAreas = $this->getUserAllowedAreas($user);
        abort_unless(in_array($equipo->area->value, $allowedAreas), 403);
    }

    private function buildEditData(Equipo $equipo): array
    {
        $tipoActual = $equipo->tipo;

        $equipo->load(['ubicacion', 'userAsignado']);

        $relacion = match ($tipoActual->modulo()) {
            Area::INFRAESTRUCTURA => 'infraestructura',
            Area::REDES => 'rede',
            Area::TRANSMISION => 'transmision',
        };

        $equipo->load($relacion);
        $registroEspecifico = $equipo->{$relacion};

        $tiposLabels = [];
        $camposPorTipo = [];

        foreach (TipoEquipo::cases() as $tipo) {
            if ($tipo->modulo() !== $tipoActual->modulo()) {
                continue;
            }

            $tiposLabels[$tipo->value] = $tipo->label();
            $camposPorTipo[$tipo->value] = [
                'area' => $tipo->modulo()->value,
                'campos' => $tipo->camposEspecificos(),
                'requiereEncargado' => $tipo->requiereEncargado(),
            ];
        }

        $datosEspecificos = [];
        if ($registroEspecifico) {
            $datosEspecificos = collect($registroEspecifico->toArray())
                ->except(['id', 'created_at', 'updated_at', 'equipo', 'contraseña_bios'])
                ->map(fn ($valor) => $valor ?? '')
                ->toArray();
        }

        return [
            'equipo' => [
                'id' => $equipo->id,
                'tipo' => $tipoActual->value,
                'ubicacion_id' => (string) $equipo->ubicacion_id,
                'asignado_id' => $equipo->asignado_id ?? '',
                'marca' => $equipo->marca ?? '',
                'modelo' => $equipo->modelo,
                'serial' => $equipo->serial,
                'detalle' => $equipo->detalle ?? '',
                'tiene_contrasena_bios' => (bool) ($registroEspecifico?->contraseña_bios ?? null),
                ...$datosEspecificos,
            ],
            'tiposLabels' => $tiposLabels,
            'camposPorTipo' => $camposPorTipo,
            'ubicaciones' => Ubicacion::orderBy('locacion')->get(['id', 'estado', 'locacion']),
            'asignados' => UserAsignado::orderBy('nombre')->get(['cedula', 'nombre', 'apellido']),
        ];
    }
   
    public function update(Request $request, Equipo $equipo)
    {
        $user = Auth::user();
        abort_unless($user->can('editar_equipos'), 403);

        $allowedAreas = $this->getUserAllowedAreas($user);
        abort_unless(in_array($equipo->area->value, $allowedAreas), 403);

        $tipo = TipoEquipo::tryFrom((string) $request->input('tipo'));

        if (! $tipo || $tipo->modulo() !== $equipo->area) {
            return back()->withErrors(['tipo' => 'Tipo de equipo inválido para esta área.'])->withInput();
        }

        $camposEspecificos = $tipo->camposEspecificos();
        $requiereEncargado = $tipo->requiereEncargado();

        $rules = [
            'tipo' => ['required', Rule::in(array_column(TipoEquipo::cases(), 'value'))],
            'ubicacion_id' => ['required', 'integer', 'exists:ubicacions,id'],
            'marca' => ['nullable', 'string', 'max:255'],
            'modelo' => ['required', 'string', 'max:255'],
            'serial' => ['required', 'string', 'max:255', Rule::unique('equipos', 'serial')->ignore($equipo->id)],
            'detalle' => ['nullable', 'string'],
            'asignado_id' => $requiereEncargado
                ? ['required', 'string', 'exists:user_asignados,cedula']
                : ['prohibited'],
        ];

        $reglasCampos = [
            'anio' => ['nullable', 'digits:4'],
            'ram' => ['required', 'string', 'max:50'],
            'disco' => ['required', 'string', 'max:100'],
            'direccion_mac' => ['required', 'string', 'regex:/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/'],
            'sistema_operativo' => ['required', 'string', 'max:100'],
            'numero_inventario' => ['required', 'string', 'max:100'],
            'dominio' => ['nullable', 'string', 'max:255'],
            'puerto' => ['required', 'string', 'max:50'],
            'contraseña_bios' => ['nullable', 'string', 'min:4'],
            'direccion_ip' => ['required', 'ip'],
            'extension' => ['required', 'string', 'max:50'],
            'ubicacion_puerto' => ['required', 'string', 'max:100'],
            'potencia' => ['required', 'string', 'max:50'],
            'rango_frecuencia' => ['required', 'string', 'max:100'],
            'unidad_usuario' => ['required', 'string', 'max:255'],
            'caracteristicas' => ['nullable', 'string'],
        ];

        foreach ($camposEspecificos as $campo) {
            $rules[$campo] = $reglasCampos[$campo] ?? ['nullable', 'string', 'max:255'];
        }

        $validated = $request->validate($rules);

        DB::transaction(function () use ($validated, $tipo, $camposEspecificos, $equipo) {
            $equipo->update([
                'ubicacion_id' => $validated['ubicacion_id'],
                'asignado_id' => $validated['asignado_id'] ?: null,
                'tipo' => $tipo->value,
                'marca' => $validated['marca'] ?: null,
                'modelo' => $validated['modelo'],
                'serial' => $validated['serial'],
                'detalle' => $validated['detalle'] ?: null,
            ]);

            $modeloEspecifico = match ($tipo->modulo()) {
                Area::INFRAESTRUCTURA => Infraestructura::class,
                Area::REDES => Rede::class,
                Area::TRANSMISION => Transmision::class,
            };

            $camposPosibles = match ($tipo->modulo()) {
                Area::INFRAESTRUCTURA => ['anio', 'ram', 'disco', 'direccion_mac', 'sistema_operativo', 'numero_inventario', 'dominio'],
                Area::REDES => ['puerto', 'puerto_fibra', 'contraseña_bios', 'direccion_ip', 'direccion_mac', 'extension', 'ubicacion_puerto'],
                Area::TRANSMISION => ['potencia', 'rango_frecuencia', 'unidad_usuario', 'caracteristicas', 'numero_inventario'],
            };

            // Reseteamos a null TODOS los campos posibles de esta tabla y solo
            // dejamos los del tipo seleccionado. Así, si cambian de "micro_escritorio"
            // a "impresora", no quedan datos viejos (ram, disco, etc.) huérfanos.
            $datosEspecificos = array_fill_keys($camposPosibles, null);

            foreach ($camposEspecificos as $campo) {
                $datosEspecificos[$campo] = $validated[$campo] ?? null;
            }

            $registro = $modeloEspecifico::find($equipo->id);

            // La contraseña del BIOS es especial: si la dejaron en blanco,
            // conservamos la que ya estaba en vez de borrarla.
            if (array_key_exists('contraseña_bios', $datosEspecificos)) {
                if (!empty($datosEspecificos['contraseña_bios'])) {
                    $datosEspecificos['contraseña_bios'] = Hash::make($datosEspecificos['contraseña_bios']);
                } else {
                    $datosEspecificos['contraseña_bios'] = $registro?->contraseña_bios;
                }
            }

            if ($registro) {
                $registro->forceFill($datosEspecificos)->save();
            } else {
                $nuevo = new $modeloEspecifico();
                $nuevo->forceFill($datosEspecificos);
                $nuevo->id = $equipo->id;
                $nuevo->save();
            }

            $oldData = $registro->getOriginal();
            $newData = $registro->getAttributes();

            // Definir los campos que queremos comparar (según el área)
            $fieldsToCompare = match ($tipo->modulo()) {
                Area::INFRAESTRUCTURA => ['anio', 'ram', 'disco', 'direccion_mac', 'sistema_operativo', 'numero_inventario', 'dominio'],
                Area::REDES         => ['puerto', 'puerto_fibra', 'direccion_ip', 'direccion_mac', 'extension', 'ubicacion_puerto'],
                Area::TRANSMISION   => ['potencia', 'rango_frecuencia', 'unidad_usuario', 'caracteristicas', 'numero_inventario'],
                default => [],
            };

            $changes = [];
            foreach ($fieldsToCompare as $field) {
                $old = $oldData[$field] ?? null;
                $new = $newData[$field] ?? null;
                if ($old != $new) {
                    // Si es contraseña, no mostrar el valor, solo indicar que cambió
                    if ($field === 'contraseña_bios') {
                        $changes[] = "contraseña BIOS: modificada";
                    } else {
                        $changes[] = "{$field}: de '{$old}' a '{$new}'";
                    }
                }           
            }

            if (!empty($changes)) {
                HistorialEquipo::create([
                    'usuario_id' => auth()->id(),
                    'equipo_id'  => $equipo->id,
                    'detalle'    => 'Cambios en ' . $tipo->modulo()->value . ': ' . implode(', ', $changes),
                    'fecha_ajuste' => now(),
                ]);
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Equipo actualizado correctamente.']);
        return to_route('equipos.index');
    }

   
    public function destroy(Equipo $equipo)
    {
        
    }

    private function getEstadosRegion(): Collection
    {
        return collect(EstadoRegion::cases())->map(fn($case) => [
            'value' => $case->value,
            'label' => $case->label(),
        ])->values();
    }

    private function getUserAllowedAreas($user): array
    {
        if ($user->hasRole(Cargo::ADMINISTRADOR->value)) {
            return array_map(fn($area) => $area->value, Area::cases());
        }

        if ($user->area) {
            return [$user->area->value];
        }

        return [];
    }

    private function getRelacionEquipo($allowedAreas): array
    {
        $listAreas = collect(Area::cases())->map(fn($area) => $area->value)->toArray();
        $relacion = [];

        foreach ($listAreas as $area) {
            if (in_array($area, $allowedAreas)) {
                switch ($area) {
                    case 'infraestructura':
                        $relacion[] = 'infraestructura';
                        break;
                    case 'redes':
                        $relacion[] = 'rede';
                        break;
                    case 'transmision_datos':
                        $relacion[] = 'transmision';
                        break;
                }
            }
        }
        return $relacion;
    }
   
}