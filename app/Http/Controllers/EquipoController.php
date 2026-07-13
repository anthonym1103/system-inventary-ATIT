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
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Crypt;

class EquipoController extends Controller
{

    public function index(Request $request){
        $user = Auth::user();
        $areaFilter = $request->input('area');

        if ($user->hasRole(Cargo::ADMINISTRADOR->value) && empty($areaFilter)) {
            return redirect()->route('equipos.index', ['area' => 'infraestructura']);
        }

        if (!$user->hasRole(Cargo::ADMINISTRADOR->value) && $areaFilter && $areaFilter !== $user->area->value) {
            return redirect()->route('equipos.index');
        }

        if($user->hasRole(Cargo::ADMINISTRADOR->value) && $areaFilter && in_array($areaFilter, array_column(Area::cases(), 'value'))){
            $allowedAreas = [$areaFilter];
        }else{
            $allowedAreas = $this->getUserAllowedAreas($user);
        }

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
        if($areaFilter){
            $query->where('area', $areaFilter);
        }

        // 5. Paginación (10 por página, puedes cambiar)
        $equipos = $query->latest()->paginate(10)->onEachSide(1)->withQueryString();

        // 6. Datos para filtros (tipos, condiciones, ubicaciones)
        $tiposLabels = [];
        foreach (TipoEquipo::cases() as $tipo) {
            if(count($allowedAreas) === 1 && in_array($tipo->modulo()->value, $allowedAreas)){
                $tiposLabels[$tipo->value] = $tipo->label();
            }else{
                foreach($allowedAreas as $area){
                    if($tipo->modulo()->value === $area){
                        $tiposLabels[$tipo->value] = $tipo->label();
                    }
                }
            }
        }

        // Solo mostrar ubicaciones que tengan equipos en las áreas permitidas
        $ubicacionesCargadas = Ubicacion::whereHas('equipos', function ($q) use ($allowedAreas, $user) {
            if (!$user->hasRole(Cargo::ADMINISTRADOR->value) && !empty($allowedAreas)) {
                $q->whereIn('area', $allowedAreas);
            }
        })->get(['id', 'estado']);

        $ubicaciones = $this->getEstadosRegion();

        $estadosLabels = [];
        foreach (EstadoRegion::cases() as $estado) {
            $estadosLabels[$estado->value] = $estado->label();
        }

        $condicionesLabels = [];
        foreach (CondicionEquipo::cases() as $condicion) {
            $condicionesLabels[$condicion->value] = $condicion->label();
        }

        // 7. Obtener permisos del usuario para acciones (opcional)
        $permissions = [
            'can_create' => $user->can('crear_equipos'),
            'can_edit'   => $user->can('editar_equipos'),
            'can_delete' => $user->can('eliminar_equipos'),
            'can_viewHistorial'=> $user->can('ver_historial'),
            'can_asigRoles' => $user->can('asignar_roles'),
        ];

        $condiciones = $this->getCondiciones();

        return Inertia::render('equipos/index', [
            'equipos' => $equipos,
            'tiposLabels' => $tiposLabels,
            'estadosLabels' => $estadosLabels,
            'condicionesLabels' => $condicionesLabels,
            'condiciones' => $condiciones,
            'ubicaciones' => $ubicaciones,
            'filters' => $request->only(['search', 'tipo', 'condicion', 'ubicacion_id']) +  ['area' => $areaFilter],
            'permissions' => $permissions,
        ]);

    }

    public function show(Equipo $equipo)
    {
        $user = Auth::user();
        $allowedAreas = $this->getUserAllowedAreas($user);
        abort_unless(in_array($equipo->area->value, $allowedAreas), 403);

        $relacion = match ($equipo->tipo->modulo()) {
            Area::INFRAESTRUCTURA => 'infraestructura',
            Area::REDES => 'rede',
            Area::TRANSMISION => 'transmision',
        };

        $equipo->load(['ubicacion', 'userAsignado', $relacion]);
        $registroEspecifico = $equipo->{$relacion};

        if ($registroEspecifico && !empty($registroEspecifico->contraseña_bios)) {
            $registroEspecifico->contraseña_bios = Crypt::decryptString($registroEspecifico->contraseña_bios);
        }

        return response()->json($equipo);
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

        $ubicaciones = $this->getEstadosRegion();
        $condiciones = $this->getCondiciones();

        return Inertia::render('equipos/create', [
            'tiposLabels' => $tiposLabels,
            'camposPorTipo' => $camposPorTipo,
            'ubicaciones' => $ubicaciones,
            'condiciones' => $condiciones,
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
            'locacions' => ['required', 'string', 'max:255'],
            'condicion' => ['required', Rule::in(array_column(CondicionEquipo::cases(), 'value'))],
            'marca' => ['nullable', 'string', 'max:255'],
            'modelo' => ['required', 'string', 'max:255'],
            'serial' => ['required', 'string', 'max:255', 'unique:equipos,serial'],
            'detalle' => ['nullable', 'string'],
            'asignado_cedula'    => $requiereEncargado ? ['required', 'string', 'max:20']  : ['nullable'],
            'asignado_nombre'    => $requiereEncargado ? ['required', 'string', 'max:255'] : ['nullable'],
            'asignado_apellido'  => $requiereEncargado ? ['required', 'string', 'max:255'] : ['nullable'],
            'asignado_telefono'  => ['nullable', 'string', 'max:20'],
            'asignado_gerencia'  => ['nullable', 'string', 'max:255'],
        ];

        // Reglas por campo específico de la tabla del área correspondiente.
        $reglasCampos = [
            'anio' => ['nullable', 'digits:4'],
            'ram' => ['required', 'string', 'max:50'],
            'disco' => ['required', 'string', 'max:100'],
            'direccion_mac' => ['nullable', 'string', 'regex:/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/'],
            'sistema_operativo' => ['required', 'string', 'max:100'],
            'numero_inventario' => ['required', 'string', 'max:100'],
            'dominio' => ['nullable', 'string', 'max:255'],
            'puerto' => ['required', 'string', 'max:50'],
            'puerto_fibra' => ['nullable', 'string', 'max:50'],
            'contraseña_bios' => ['required', 'string', 'min:4'],
            'direccion_ip' => ['nullable', 'ip'],
            'extension' => ['nullable', 'string', 'max:50'],
            'ubicacion_puerto' => ['nullable', 'string', 'max:100'],
            'potencia' => ['required', 'string', 'max:50'],
            'rango_frecuencia' => ['required', 'string', 'max:100'],
            'unidad_usuario' => ['required', 'string', 'max:255'],
            'caracteristicas' => ['nullable', 'string'],
        ];

        foreach ($camposEspecificos as $campo) {
            $rules[$campo] = $reglasCampos[$campo] ?? ['nullable', 'string', 'max:255'];
        }

        $validated = $request->validate($rules);

        // FIX #2: se agregó $requiereEncargado al "use" del closure, ya que se
        // utiliza dentro para decidir si se crea el UserAsignado. Antes no
        // estaba importado y provocaba un error de variable indefinida.
        DB::transaction(function () use ($validated, $tipo, $camposEspecificos, $requiereEncargado) {
            $asignadoId = null;

            if ($requiereEncargado && ! empty($validated['asignado_cedula'])) {
                $asignado = UserAsignado::updateOrCreate(
                    ['cedula' => $validated['asignado_cedula']],
                    [
                        'nombre'   => $validated['asignado_nombre'],
                        'apellido' => $validated['asignado_apellido'],
                        'telefono' => $validated['asignado_telefono'] ?: null,
                        'gerencia' => $validated['asignado_gerencia'] ?: null,
                    ]
                );
                $asignadoId = $asignado->cedula;
            }

            $ubicacion = Ubicacion::firstOrCreate([
                    'estado' => $validated['estados'],
                    'locacion' => $validated['locacions'],
                ]);

            $equipo = Equipo::create([
                'ubicacion_id' => $ubicacion->id,
                'asignado_id' => $asignadoId,
                'area' => $tipo->modulo()->value,
                'tipo' => $tipo->value,
                'condicion' => $validated['condicion'],
                'marca' => $validated['marca'] ?: null,
                'modelo' => $validated['modelo'],
                'serial' => $validated['serial'],
                'detalle' => $validated['detalle'] ?: null,
            ]);

            // Solo nos quedamos con los campos que aplican a este tipo.
            $datosEspecificos = collect($validated)->only($camposEspecificos)->toArray();

            if (array_key_exists('contraseña_bios', $datosEspecificos)) {
                $datosEspecificos['contraseña_bios'] = Crypt::encryptString($datosEspecificos['contraseña_bios']);
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

            // --- Registro de historial de creación ---
            $camposLabels = [
                'anio' => 'Año', 'ram' => 'RAM', 'disco' => 'Disco',
                'direccion_mac' => 'Dirección MAC', 'sistema_operativo' => 'Sistema Operativo',
                'numero_inventario' => 'Número de Inventario', 'dominio' => 'Dominio',
                'puerto' => 'Puerto', 'puerto_fibra' => 'Puerto Fibra',
                'direccion_ip' => 'Dirección IP', 'extension' => 'Extensión',
                'ubicacion_puerto' => 'Ubicación del Puerto', 'potencia' => 'Potencia',
                'rango_frecuencia' => 'Rango de Frecuencia', 'unidad_usuario' => 'Unidad / Usuario',
                'caracteristicas' => 'Características',
            ];

            $detalleCreacion = [
                "Tipo: {$tipo->label()}",
                "Marca: " . ($validated['marca'] ?: '—'),
                "Modelo: {$validated['modelo']}",
                "Serial: {$validated['serial']}",
            ];

            foreach ($camposEspecificos as $campo) {
                if ($campo === 'contraseña_bios') {
                    continue; // nunca se registra en texto plano
                }

                $valor = $validated[$campo] ?? null;
                if ($valor) {
                    $label = $camposLabels[$campo] ?? $campo;
                    $detalleCreacion[] = "{$label}: {$valor}";
                }
            }

            HistorialEquipo::create([
                'usuario_id' => auth()->id(),
                'equipo_id'  => $equipo->id,
                'detalle'    => 'Equipo registrado: ' . implode('; ', $detalleCreacion),
                'fecha_ajuste' => now(),
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Equipo creado correctamente.']);

        return to_route('equipos.index');
    }

    public function edit(Equipo $equipo)
    {
        $this->authorizeEdit($equipo);
        $data = $this->buildEditData($equipo);
        $data['condiciones'] = $this->getCondiciones();

        return Inertia::render('equipos/edit', $data );
    }

    public function editData(Equipo $equipo)
    {
        $this->authorizeEdit($equipo);
        $data = $this->buildEditData($equipo);
        $data['condiciones'] = $this->getCondiciones();

        return response()->json($data);
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

        // Se usa la ubicación ya cargada para exponer "estados" y "locacions",
        // los mismos nombres de campo que usa el formulario tanto en crear
        // como en editar. Antes se devolvía "ubicacion_id", que el formulario
        // nunca leía ni enviaba, dejando el Select de Estado/Región vacío.
        $ubicacionActual = $equipo->ubicacion;

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
                ->except(['id', 'created_at', 'updated_at', 'equipo'])
                ->map(function ($valor, $key) use ($registroEspecifico) {
                    if ($key === 'contraseña_bios' && $valor) {
                        return Crypt::decryptString($valor);
                    }
                    return $valor ?? '';
                })
                ->toArray();
        }

        $ubicaciones = $this->getEstadosRegion();

        return [
            'equipo' => [
                'id' => $equipo->id,
                'tipo' => $tipoActual->value,
                'estados' => $ubicacionActual?->estado ?? '',
                'locacions' => $ubicacionActual?->locacion ?? '',
                'condicion' => $equipo->condicion->value ?? 'operativo',
                'marca' => $equipo->marca ?? '',
                'modelo' => $equipo->modelo,
                'serial' => $equipo->serial,
                'detalle' => $equipo->detalle ?? '',
                'tiene_contrasena_bios' => (bool) ($registroEspecifico?->contraseña_bios ?? null),
                'asignado_cedula'     => $equipo->userAsignado?->cedula ?? '',
                'asignado_nombre'     => $equipo->userAsignado?->nombre ?? '',
                'asignado_apellido'   => $equipo->userAsignado?->apellido ?? '',
                'asignado_telefono'   => $equipo->userAsignado?->telefono ?? '',
                'asignado_gerencia'   => $equipo->userAsignado?->gerencia ?? '',
                ...$datosEspecificos,
            ],
            'tiposLabels' => $tiposLabels,
            'camposPorTipo' => $camposPorTipo,
            'ubicaciones' => $ubicaciones,
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
            'estados' => ['required', Rule::in(array_column(EstadoRegion::cases(), 'value'))],
            'locacions' => ['required', 'string', 'max:255'],
            'condicion' => ['required', Rule::in(array_column(CondicionEquipo::cases(), 'value'))],
            'marca' => ['nullable', 'string', 'max:255'],
            'modelo' => ['required', 'string', 'max:255'],
            'serial' => ['required', 'string', 'max:255', Rule::unique('equipos', 'serial')->ignore($equipo->id)],
            'detalle' => ['nullable', 'string'],
            'asignado_cedula'   => $requiereEncargado ? ['required', 'string', 'max:20']  : ['nullable'],
            'asignado_nombre'   => $requiereEncargado ? ['required', 'string', 'max:255'] : ['nullable'],
            'asignado_apellido' => $requiereEncargado ? ['required', 'string', 'max:255'] : ['nullable'],
            'asignado_telefono' => ['nullable', 'string', 'max:20'],
            'asignado_gerencia' => ['nullable', 'string', 'max:255'],
        ];

        $reglasCampos = [
            'anio' => ['nullable', 'digits:4'],
            'ram' => ['required', 'string', 'max:50'],
            'disco' => ['required', 'string', 'max:100'],
            'direccion_mac' => ['nullable', 'string', 'regex:/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/'],
            'sistema_operativo' => ['required', 'string', 'max:100'],
            'numero_inventario' => ['required', 'string', 'max:100'],
            'dominio' => ['nullable', 'string', 'max:255'],
            'puerto' => ['required', 'string', 'max:50'],
            'puerto_fibra' => ['nullable', 'string','max:50'],
            'contraseña_bios' => ['nullable', 'string', 'min:4'],
            'direccion_ip' => ['nullable', 'ip'],
            'extension' => ['nullable', 'string', 'max:50'],
            'ubicacion_puerto' => ['nullable', 'string', 'max:100'],
            'potencia' => ['required', 'string', 'max:50'],
            'rango_frecuencia' => ['required', 'string', 'max:100'],
            'unidad_usuario' => ['required', 'string', 'max:255'],
            'caracteristicas' => ['nullable', 'string'],
        ];

        foreach ($camposEspecificos as $campo) {
            $rules[$campo] = $reglasCampos[$campo] ?? ['nullable', 'string', 'max:255'];
        }

        $validated = $request->validate($rules);

        DB::transaction(function () use ($validated, $tipo, $camposEspecificos, $equipo, $requiereEncargado) {
            $changes = [];

            $generalLabels = [
                'tipo' => 'Tipo de equipo',
                'marca' => 'Marca',
                'modelo' => 'Modelo',
                'serial' => 'Serial',
                'detalle' => 'Observaciones',
                'condicion' => 'Condición',
            ];

            $fieldsGenerales = array_merge(array_keys($generalLabels), ['ubicacion_id', 'asignado_id']);

            $before = [];
            foreach ($fieldsGenerales as $f) {
                $before[$f] = $equipo->getAttributes()[$f] ?? null;
            }

            $asignadoId = null;
            if ($requiereEncargado && ! empty($validated['asignado_cedula'])) {
                $asignado = UserAsignado::updateOrCreate(
                    ['cedula' => $validated['asignado_cedula']],
                    [
                        'nombre'   => $validated['asignado_nombre'],
                        'apellido' => $validated['asignado_apellido'],
                        'telefono' => $validated['asignado_telefono'] ?: null,
                        'gerencia' => $validated['asignado_gerencia'] ?: null,
                    ]
                );
                $asignadoId = $asignado->cedula;
            }

            $ubicacion = Ubicacion::firstOrCreate([
                'estado' => $validated['estados'],
                'locacion' => $validated['locacions'],
            ]);

            $equipo->update([
                'ubicacion_id' => $ubicacion->id,
                'asignado_id' => $asignadoId,
                'tipo' => $tipo->value,
                'condicion' => $validated['condicion'],
                'marca' => $validated['marca'] ?: null,
                'modelo' => $validated['modelo'],
                'serial' => $validated['serial'],
                'detalle' => $validated['detalle'] ?: null,
            ]);

            $after = [];
            foreach ($fieldsGenerales as $f) {
                $after[$f] = $equipo->getAttributes()[$f] ?? null;
            }

            foreach ($generalLabels as $field => $label) {
                $old = $before[$field];
                $new = $after[$field];

                if ($old == $new) {
                    continue;
                }

                if ($field === 'tipo') {
                    $old = TipoEquipo::tryFrom($old)?->label() ?? $old;
                    $new = TipoEquipo::tryFrom($new)?->label() ?? $new;
                } elseif ($field === 'condicion') {
                    $old = CondicionEquipo::tryFrom($old)?->label() ?? $old;
                    $new = CondicionEquipo::tryFrom($new)?->label() ?? $new;
                }

                $changes[] = "{$label}: '" . ($old ?? '—') . "' → '" . ($new ?? '—') . "'";
            }

            if ($before['ubicacion_id'] != $after['ubicacion_id']) {
                $changes[] = 'Ubicación actualizada';
            }
            if ($before['asignado_id'] != $after['asignado_id']) {
                $changes[] = 'Encargado actualizado';
            }

            // --- Campos específicos del área (sin cambios respecto a antes) ---
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

            $camposLabels = [
                'anio' => 'Año', 'ram' => 'RAM', 'disco' => 'Disco',
                'direccion_mac' => 'Dirección MAC', 'sistema_operativo' => 'Sistema Operativo',
                'numero_inventario' => 'Número de Inventario', 'dominio' => 'Dominio',
                'puerto' => 'Puerto', 'puerto_fibra' => 'Puerto Fibra',
                'direccion_ip' => 'Dirección IP', 'extension' => 'Extensión',
                'ubicacion_puerto' => 'Ubicación del Puerto', 'potencia' => 'Potencia',
                'rango_frecuencia' => 'Rango de Frecuencia', 'unidad_usuario' => 'Unidad / Usuario',
                'caracteristicas' => 'Características',
            ];

            $datosEspecificos = array_fill_keys($camposPosibles, null);
            foreach ($camposEspecificos as $campo) {
                $datosEspecificos[$campo] = $validated[$campo] ?? null;
            }

            $registro = $modeloEspecifico::find($equipo->id);
            $oldData = $registro?->getAttributes() ?? [];

            $oldPasswordDecrypted = null;
            if (!empty($oldData['contraseña_bios'] ?? null)) {
                try {
                $oldPasswordDecrypted = Crypt::decryptString($oldData['contraseña_bios']);
                } catch (\Exception $e) {
                    $oldPasswordDecrypted = null;
                }
            }

            $passwordCambiada = false;
            if (array_key_exists('contraseña_bios', $datosEspecificos)) {
                $submitted = $datosEspecificos['contraseña_bios'];

                if (!empty($submitted) && $submitted !== $oldPasswordDecrypted) {
                    $passwordCambiada = true;
                    $datosEspecificos['contraseña_bios'] = Crypt::encryptString($submitted);
                } else {
                    $datosEspecificos['contraseña_bios'] = $oldData['contraseña_bios'] ?? null;
                }
            }

            if ($registro) {
                $registro->forceFill($datosEspecificos)->save();
            } else {
                $registro = new $modeloEspecifico();
                $registro->forceFill($datosEspecificos);
                $registro->id = $equipo->id;
                $registro->save();
            }

            $newData = $registro->getAttributes();

            foreach ($camposPosibles as $field) {
                if ($field === 'contraseña_bios') {
                    continue;
                }

                $old = $oldData[$field] ?? null;
                $new = $newData[$field] ?? null;

                if ($old != $new) {
                    $label = $camposLabels[$field] ?? $field;
                    $changes[] = "{$label}: '" . ($old ?? '—') . "' → '" . ($new ?? '—') . "'";
                }
            }

            if ($passwordCambiada) {
                $changes[] = 'Contraseña BIOS: modificada';
            }

            if (!empty($changes)) {
                HistorialEquipo::create([
                    'usuario_id' => auth()->id(),
                    'equipo_id'  => $equipo->id,
                    'detalle'    => 'Equipo actualizado: ' . implode('; ', $changes),
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

    private function getCondiciones(): Collection
    {
        return collect(CondicionEquipo::cases())->map(fn($case) => [
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
