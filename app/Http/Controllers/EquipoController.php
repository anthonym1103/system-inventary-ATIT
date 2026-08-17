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
use App\Enums\Sede;
use App\Enums\Piso;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Settings\FirmaController;
use setasign\Fpdi\Tcpdf\Fpdi as FpdiTcpdf;

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

        if($request->filled('sede') && $request->input('sede') !== 'all'){
            $sedeBuscada = $request->input('sede');
            $query->whereHas('ubicacion', function($q) use ($sedeBuscada){
                $q->where('sede', $sedeBuscada);
            });
        }

        if($request->filled('piso') && $request->input('piso') !== 'all'){
            $pisoBuscado = $request->input('piso');
            $query->whereHas('ubicacion', function($q) use ($pisoBuscado){
                $q->where('piso', $pisoBuscado);
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

        $sedesLabels = [];
        foreach (Sede::cases() as $sede) {
            $sedesLabels[$sede->value] = $sede->label();
        }

        $pisosLabels = [];
        foreach (Piso::cases() as $piso) {
            $pisosLabels[$piso->value] = $piso->label();
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
            'sedes' => $this->getSedes(),
            'pisos' => $this->getPisos(),
            'sedesLabels' => $sedesLabels,
            'pisosLabels' => $pisosLabels,
            'filters' => $request->only(['search', 'tipo', 'condicion', 'ubicacion_id']) +  ['area' => $areaFilter],
            'permissions' => $permissions,
        ]);

    }

    public function reporte(Request $request)
    {
        $user = Auth::user();

        [$query] = $this->buildFilteredEquiposQuery($request, $user);

        $equipos = $query->with(['ubicacion'])->latest()->get();

        $total = $equipos->count();
        $porCondicion = $equipos->groupBy(fn ($e) => $e->condicion->value)->map->count();
        $porArea = $equipos->groupBy(fn ($e) => $e->area->label())->map->count()->sortDesc();
        $porTipo = $equipos->groupBy(fn ($e) => $e->tipo->label())->map->count()->sortDesc();
        $porSede = $equipos->groupBy(fn ($e) => $e->ubicacion?->sede?->label() ?? 'Sin sede')->map->count()->sortDesc();

        $filtrosAplicados = $this->describirFiltros($request);

        $pdfPath = $this->generarPdfReporte($equipos, $total, $porCondicion, $porArea, $porTipo, $porSede, $filtrosAplicados, $user);

        return response()->file($pdfPath, ['Content-Type' => 'application/pdf'])->deleteFileAfterSend(true);
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
            ];
        }

        $ubicaciones = $this->getEstadosRegion();
        $condiciones = $this->getCondiciones();

        return Inertia::render('equipos/create', [
            'tiposLabels' => $tiposLabels,
            'camposPorTipo' => $camposPorTipo,
            'ubicaciones' => $ubicaciones,
            'sedes' => $this->getSedes(),
            'pisos' => $this->getPisos(),
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
        $conEncargado = $request->boolean('con_encargado');

        $rules = [
            'tipo' => ['required', Rule::in(array_column(TipoEquipo::cases(), 'value'))],
            'estados' => ['required', Rule::in(array_column(EstadoRegion::cases(), 'value'))],
            'sedes' => ['required', Rule::in(array_column(Sede::cases(), 'value'))],
            'pisos' => ['required', Rule::in(array_column(Piso::cases(), 'value'))],
            'condicion' => ['required', Rule::in(array_column(CondicionEquipo::cases(), 'value'))],
            'marca' => ['nullable', 'string', 'max:255'],
            'modelo' => ['required', 'string', 'max:255'],
            'serial' => ['required', 'string', 'max:255', 'unique:equipos,serial'],
            'detalle' => ['nullable', 'string'],
            'con_encargado' => ['nullable', 'boolean'],
            'asignado_cedula' => $conEncargado ? ['required', 'string', 'max:20']  : ['nullable'],
            'asignado_nombre' => $conEncargado ? ['required', 'string', 'max:255', 'regex:/^[\pL\s]+$/u'] : ['nullable'],
            'asignado_apellido' => $conEncargado ? ['required', 'string', 'max:255', 'regex:/^[\pL\s]+$/u'] : ['nullable'],
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

        $sedeSeleccionada = Sede::tryFrom($validated['sedes']);
        if (! $sedeSeleccionada || $sedeSeleccionada->region()->value !== $validated['estados']) {
            return back()->withErrors(['sedes' => 'La sede seleccionada no pertenece al estado indicado.'])->withInput();
        }

        // FIX #2: se agregó $requiereEncargado al "use" del closure, ya que se
        // utiliza dentro para decidir si se crea el UserAsignado. Antes no
        // estaba importado y provocaba un error de variable indefinida.
        DB::transaction(function () use ($validated, $tipo, $camposEspecificos, $conEncargado) {
            $asignadoId = null;

            if ($conEncargado && ! empty($validated['asignado_cedula'])) {
                $asignado = UserAsignado::updateOrCreate(
                    ['cedula' => $validated['asignado_cedula']],
                    [
                        'nombre'   => $this->formatName($validated['asignado_nombre']),
                        'apellido' => $this->formatName($validated['asignado_apellido']),
                        'telefono' => $validated['asignado_telefono'] ?: null,
                        'gerencia' => $validated['asignado_gerencia'] ?: null,
                    ]
                );
                $asignadoId = $asignado->cedula;
            }

            $ubicacion = Ubicacion::firstOrCreate([
                    'estado' => $validated['estados'],
                    'sede' => $validated['sedes'],
                    'piso' => $validated['pisos'],
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

            $detalleCreacion =[
                "Marca: " . ($validated['marca'] ?: '—'),
                "Modelo: {$validated['modelo']}",
                "Ubicación: {$ubicacion->sede->label()} - {$ubicacion->piso->label()}",
            ];
            
            if ($asignadoId) {
                $detalleCreacion[] = "Encargado: {$validated['asignado_nombre']} {$validated['asignado_apellido']}";
            }

            HistorialEquipo::create([
                'usuario_id' => auth()->id(),
                'equipo_id'  => $equipo->id,
                'equipo_area' => $equipo->area->value,
                'equipo_tipo' => $equipo->tipo->value,
                'equipo_serial' => $equipo->serial,
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
        $data['sedes'] = $this->getSedes();
        $data['pisos'] = $this->getPisos();

        return Inertia::render('equipos/edit', $data );
    }

    public function editData(Equipo $equipo)
    {
        $this->authorizeEdit($equipo);
        $data = $this->buildEditData($equipo);
        $data['condiciones'] = $this->getCondiciones();
        $data['sedes'] = $this->getSedes();
        $data['pisos'] = $this->getPisos();

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
                'sedes' => $ubicacionActual?->sede?->value ?? '',
                'pisos' => $ubicacionActual?->piso?->value ?? '',
                'condicion' => $equipo->condicion->value ?? 'operativo',
                'marca' => $equipo->marca ?? '',
                'modelo' => $equipo->modelo,
                'serial' => $equipo->serial,
                'detalle' => $equipo->detalle ?? '',
                'tiene_contrasena_bios' => (bool) ($registroEspecifico?->contraseña_bios ?? null),
                'con_encargado'        => (bool) $equipo->userAsignado,
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

        $tipo = $equipo->tipo;

        if (! $tipo || $tipo->modulo() !== $equipo->area) {
            return back()->withErrors(['tipo' => 'Tipo de equipo inválido para esta área.'])->withInput();
        }
   

        $camposEspecificos = $tipo->camposEspecificos();
        $conEncargado = $request->boolean('con_encargado');

        $rules = [
            'estados' => ['required', Rule::in(array_column(EstadoRegion::cases(), 'value'))],
            'sedes' => ['required', Rule::in(array_column(Sede::cases(), 'value'))],
            'pisos' => ['required', Rule::in(array_column(Piso::cases(), 'value'))],
            'condicion' => ['required', Rule::in(array_column(CondicionEquipo::cases(), 'value'))],
            'detalle' => ['nullable', 'string'],
            'con_encargado'     => ['nullable', 'boolean'],
            'asignado_cedula'   => $conEncargado ? ['required', 'string', 'max:20']  : ['nullable'],
            'asignado_nombre'   => $conEncargado ? ['required', 'string', 'max:255', 'regex:/^[\pL\s]+$/u'] : ['nullable'],
            'asignado_apellido' => $conEncargado ? ['required', 'string', 'max:255', 'regex:/^[\pL\s]+$/u'] : ['nullable'],
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

        $sedeSeleccionada = Sede::tryFrom($validated['sedes']);
        if (! $sedeSeleccionada || $sedeSeleccionada->region()->value !== $validated['estados']) {
            return back()->withErrors(['sedes' => 'La sede seleccionada no pertenece al estado indicado.'])->withInput();
        }

        DB::transaction(function () use ($validated, $tipo, $camposEspecificos, $equipo, $conEncargado) {
            $changes = [];

            $generalLabels = [
                'detalle' => 'Observaciones',
                'condicion' => 'Condición',
            ];

            $fieldsGenerales = array_merge(array_keys($generalLabels), ['ubicacion_id', 'asignado_id']);

            $before = [];
            foreach ($fieldsGenerales as $f) {
                $before[$f] = $equipo->getAttributes()[$f] ?? null;
            }

            $asignadoId = null;
            if ($conEncargado && ! empty($validated['asignado_cedula'])) {
                $asignado = UserAsignado::updateOrCreate(
                    ['cedula' => $validated['asignado_cedula']],
                    [
                        'nombre'   => $this->formatName($validated['asignado_nombre']),
                        'apellido' => $this->formatName($validated['asignado_apellido']),
                        'telefono' => $validated['asignado_telefono'] ?: null,
                        'gerencia' => $validated['asignado_gerencia'] ?: null,
                    ]
                );
                $asignadoId = $asignado->cedula;
            }

            $ubicacion = Ubicacion::firstOrCreate([
                'estado' => $validated['estados'],
                'sede' => $validated['sedes'],
                'piso' => $validated['pisos'],
            ]);

            $equipo->update([
                'ubicacion_id' => $ubicacion->id,
                'asignado_id' => $asignadoId,
                'condicion' => $validated['condicion'],
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

                if ($field === 'condicion') {
                    $old = CondicionEquipo::tryFrom($old)?->label() ?? $old;
                    $new = CondicionEquipo::tryFrom($new)?->label() ?? $new;
                }

                $changes[] = "{$label} ha sido cambiado de (" . ($old ?? ' ') . ") → (" . ($new ?? '—') . ")";
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
                    'equipo_area' => $equipo->area->value,
                    'equipo_tipo' => $tipo->value,
                    'equipo_serial' => $equipo->serial,
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

    public function desincorporar(Request $request)
    {
        $user = Auth::user();
        abort_unless($user->can('eliminar_equipos'), 403);

        $validated = $request->validate([
            'equipo_ids' => ['nullable', 'array'],
            'equipo_ids.*' => ['integer', 'exists:equipos,id'],
            'motivo' => ['required', 'string', 'max:1000'],
            'equipos_extra' => ['nullable', 'array'],
            'para' => ['required', 'string', 'max:255'],
            'de' => ['required', 'string', 'max:255'],
            'numero' => ['required', 'string', 'max:100'],
            'equipos_extra.*.tipo' => ['required', 'string', 'max:255'],
            'equipos_extra.*.marca' => ['nullable', 'string', 'max:255'],
            'equipos_extra.*.modelo' => ['required', 'string', 'max:255'],
            'equipos_extra.*.serial' => ['nullable', 'string', 'max:255'],
            'perifericos' => ['nullable', 'array'],
            'perifericos.*.tipo' => ['required', 'string', 'max:255'],
            'perifericos.*.marca' => ['nullable', 'string', 'max:255'],
            'perifericos.*.modelo' => ['nullable', 'string', 'max:255'],
            'perifericos.*.serial' => ['nullable', 'string', 'max:255'],
            'perifericos.*.caracteristicas' => ['nullable', 'string', 'max:500'],
        ]);

        $equipoIds = $validated['equipo_ids'] ?? [];
        $equiposExtra = $validated['equipos_extra'] ?? [];
        $perifericos = $validated['perifericos'] ?? [];

        if (empty($equipoIds) && empty($equiposExtra) && empty($perifericos)) {
            return response()->json([
                'message' => 'Debes seleccionar o agregar al menos un equipo o periférico a desincorporar.',
            ], 422);
        }

        $allowedAreas = $this->getUserAllowedAreas($user);

        $equipos = collect();
        if (!empty($equipoIds)) {
            $equipos = Equipo::with(['ubicacion', 'userAsignado', 'infraestructura', 'transmision'])
                ->whereIn('id', $equipoIds)
                ->when(!$user->hasRole(Cargo::ADMINISTRADOR->value), function ($q) use ($allowedAreas) {
                    $q->whereIn('area', $allowedAreas);
                })
                ->get();
        }

        try {
            $pdfPath = $this->generarPdfDesincorporacion($equipos, $equiposExtra, $perifericos, $user, $validated['motivo'], $validated['para'], $validated['de'], $validated['numero'],);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'No se pudo generar el PDF de desincorporación.',
                'error' => $e->getMessage(),
            ], 500);
        }

        DB::transaction(function () use ($equipos, $equiposExtra, $perifericos, $validated) {
            foreach ($equipos as $equipo) {
                HistorialEquipo::create([
                    'usuario_id' => auth()->id(),
                    'equipo_id' => $equipo->id,
                    'equipo_area' => $equipo->area->value,
                    'equipo_tipo' => $equipo->tipo->value,
                    'equipo_serial' => $equipo->serial,
                    'detalle' => 'Equipo desincorporado: '
                        . '; Motivo: ' . $validated['motivo']
                        . '; Modelo: ' . $equipo->modelo
                        . '; Ubicación: ' . ($equipo->ubicacion?->locacion ?? '—')
                        . ($equipo->userAsignado
                            ? '; Encargado: ' . $equipo->userAsignado->nombre . ' ' . $equipo->userAsignado->apellido
                            : ''),
                    'fecha_ajuste' => now(),
                ]);
            }

            if ($equipos->isNotEmpty()) {
                Equipo::whereIn('id', $equipos->pluck('id'))->delete();
            }

            // Los equipos y periféricos "extra" no existen como registros, así
            // que solo dejamos constancia en el historial (equipo_id nulo).
            foreach ($equiposExtra as $extra) {
                HistorialEquipo::create([
                    'usuario_id' => auth()->id(),
                    'equipo_id' => null,
                    'equipo_area' => null,
                    'equipo_tipo' => null,
                    'equipo_serial' => $extra['serial'] ?? null,
                    'detalle' => 'Equipo desincorporado: '
                        . '; Motivo: ' . $validated['motivo']
                        . '; Tipo: ' . $extra['tipo']
                        . '; Marca: ' . ($extra['marca'] ?: '—')
                        . '; Modelo: ' . $extra['modelo']
                        . '; Serial: ' . ($extra['serial'] ?: '—'),
                    'fecha_ajuste' => now(),
                ]);
            }

            $perifericosLabels = [
                'teclado' => 'Teclado',
                'mouse' => 'Mouse',
                'monitor' => 'Monitor',
                'otro' => 'Periférico',
            ];

            foreach ($perifericos as $periferico) {
                HistorialEquipo::create([
                    'usuario_id' => auth()->id(),
                    'equipo_id' => null,
                    'equipo_area' => null,
                    'equipo_tipo' => null,
                    'equipo_serial' => $periferico['serial'] ?? null,
                    'detalle' => 'Periférico desincorporado: ' 
                        . '; Motivo: ' . $validated['motivo']
                        . '; Tipo: ' . ($perifericosLabels[$periferico['tipo']] ?? $periferico['tipo'])
                        . '; Marca: ' . ($periferico['marca'] ?: '—')
                        . '; Modelo: ' . ($periferico['modelo'] ?: '—')
                        . '; Características: ' . ($periferico['caracteristicas'] ?: '—'),
                    'fecha_ajuste' => now(),
                ]);
            }
        });

        return response()->download($pdfPath)->deleteFileAfterSend(true);
    }

    private function generarPdfDesincorporacion($equipos, array $equiposExtra, array $perifericos, $user, string $motivo, string $para, string $de, string $numero ): string
    {
        $templatePath = storage_path('app/pdf-templates/desincorporacionTecnica2.pdf');
        if (! file_exists($templatePath)) {
            throw new \RuntimeException(
                "No se encontró la plantilla PDF en: {$templatePath}. " .
                "Sube tu PDF modelo a storage/app/pdf-templates/desincorporacion.pdf"
            );
        }

        $tempDir = 'storage/temp';
        if (!Storage::disk('local')->exists($tempDir)) {
            Storage::disk('local')->makeDirectory($tempDir, 0755, true);
        }

        $fileName = 'desincorporacion_' . now()->timestamp . '.pdf';
        $outputPath = Storage::disk('local')->path($tempDir . '/' . $fileName);

        $ptToMm = fn (float $pt): float => $pt * 0.3527778;

        $pdf = new FpdiTcpdf('P', 'mm', 'LETTER', true, 'UTF-8', false);
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->SetMargins(0, 0, 0);
        $pdf->SetAutoPageBreak(false);
        $pdf->SetFont('helvetica', '', 10);

        $pdf->setSourceFile($templatePath);

        // ================== PÁGINA 1 ==================
        $tpl1 = $pdf->importPage(1);
        $size1 = $pdf->getTemplateSize($tpl1);
        $pdf->AddPage('P', [$size1['width'], $size1['height']]);
        $pdf->useTemplate($tpl1, 0, 0, $size1['width'], $size1['height']);

        $pdf->SetXY($ptToMm(78.62 + 34.03) + 15, $ptToMm(102.02));
        $pdf->Cell(0, 4.5, $para);

        $pdf->SetXY($ptToMm(78.62 + 18.91) + 20, $ptToMm(130.42));
        $pdf->Cell(0, 4.5, $de);

        $pdf->SetXY($ptToMm(78.62 + 52.61) + 8, $ptToMm(156.82));
        $pdf->Cell(0, 4.5, $numero);

        $pdf->SetXY($ptToMm(78.62 + 41.47) + 12, $ptToMm(177.02));
        $pdf->Cell(0, 4.5, now()->translatedFormat('j \d\e F \d\e\l Y'));

        // --- Helpers reutilizables para todas las tablas del documento ---
        $dibujarTitulo = function (float $x, float $y, string $texto) use ($pdf) {
            $pdf->SetFont('helvetica', 'BU', 12);
            $pdf->SetXY($x, $y);
            $pdf->Cell(0, 6, $texto, 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
        };

        $dibujarEncabezadoTabla = function (float $x, float $y, array $columnas) use ($pdf) {
            $pdf->SetFont('helvetica', 'B', 10);
            $cx = $x;
            foreach ($columnas as $col) {
                $pdf->SetXY($cx, $y);
                $pdf->Cell($col['width'], 6, $col['header'], 1, 0, 'C');
                $cx += $col['width'];
            }
        };

        $calcularAlturaFila = function (array $valores, array $columnas) use ($pdf) {
            $lineHeight = 7;
            $maxLineas = 1;

            foreach ($columnas as $i => $col) {
                $lineas = $pdf->getNumLines($valores[$i], $col['width'] - 2);
                $maxLineas = max($maxLineas, $lineas);
            }

            return max(6, $maxLineas * $lineHeight);
        };

        $dibujarFila = function (float $x, float $y, array $valores, float $altura, array $columnas) use ($pdf) {
            $cx = $x;
            $pdf->SetFont('helvetica', '', 9);
            foreach ($columnas as $i => $col) {
                $pdf->MultiCell(
                    $col['width'], $altura, $valores[$i], 1, $col['align'],
                    false, 0, $cx, $y, true, 0, false, true, $altura, 'M'
                );
                $cx += $col['width'];
            }
            $pdf->SetFont('helvetica', '', 10);
        };

        // ---------- TABLA PRINCIPAL: equipos del sistema + equipos no registrados ----------
        $tablaX = $ptToMm(79.62);
        $yInicioPagina1 = $ptToMm(274.83 + 12.00) + 6;
        $limiteY = $size1['height'] - 60;
        $alturaFilaVacia = 6;

        $columnasPrincipal = [
            ['header' => 'Nº',      'width' => 8,  'align' => 'C'],
            ['header' => 'Tipo',   'width' => 32, 'align' => 'L'],
            ['header' => 'Marca',  'width' => 30, 'align' => 'L'],
            ['header' => 'Modelo', 'width' => 30, 'align' => 'L'],
            ['header' => 'Serial', 'width' => 62, 'align' => 'L'],
        ];

        $filasPrincipales = [];

        foreach ($equipos as $equipo) {
            $filasPrincipales[] = [
                'tipo' => $equipo->tipo->label(),
                'marca' => $equipo->marca ?? '—',
                'modelo' => $equipo->modelo,
                'serial' => $equipo->serial,
            ];
        }

        foreach ($equiposExtra as $extra) {
            $filasPrincipales[] = [
                'tipo' => $extra['tipo'] . ' (no registrado)',
                'marca' => $extra['marca'] ?: '—',
                'modelo' => $extra['modelo'],
                'serial' => $extra['serial'] ?: '—',
            ];
        }

        $dibujarTitulo($tablaX, $yInicioPagina1, 'Equipos');
        $y = $yInicioPagina1 + 8;
        $dibujarEncabezadoTabla($tablaX, $y, $columnasPrincipal);
        $y += 6;

        $numero = 1;
        $enPagina2 = false;
        $size2 = null;

        foreach ($filasPrincipales as $fila) {
            $valores = [(string) $numero, $fila['tipo'], $fila['marca'], $fila['modelo'], $fila['serial']];

            $altura = $calcularAlturaFila($valores, $columnasPrincipal);
            $limiteActual = $enPagina2 ? ($size2['height'] - 60) : $limiteY;

            if ($y + $altura > $limiteActual) {
                if ($enPagina2) {
                    throw new \RuntimeException(
                        "El informe no tiene espacio suficiente para todos los equipos seleccionados. " .
                        "Reduce la cantidad de equipos por desincorporación."
                    );
                }

                $tpl2 = $pdf->importPage(2);
                $size2 = $pdf->getTemplateSize($tpl2);
                $pdf->AddPage('P', [$size2['width'], $size2['height']]);
                $pdf->useTemplate($tpl2, 0, 0, $size2['width'], $size2['height']);

                $enPagina2 = true;
                $y = 30;
                $dibujarTitulo($tablaX, $y, 'Equipos (continuación)');
                $y += 8;
                $dibujarEncabezadoTabla($tablaX, $y, $columnasPrincipal);
                $y += 6;
            }

            $dibujarFila($tablaX, $y, $valores, $altura, $columnasPrincipal);
            $y += $altura;
            $numero++;
        }

        $limiteActual = $enPagina2 ? ($size2['height'] - 60) : $limiteY;
        $valoresVacios = array_fill(0, count($columnasPrincipal), '');

        if(!$enPagina2){
            while ($y + $alturaFilaVacia <= $limiteActual) {
                $dibujarFila($tablaX, $y, $valoresVacios, $alturaFilaVacia, $columnasPrincipal);
                $y += $alturaFilaVacia;
            }
        }

        // ---------- TABLAS DE EQUIPOS ADICIONALES / PERIFÉRICOS ----------
        // Se agrupan por el nombre que escribió el usuario (sin distinguir
        // mayúsculas/espacios) y se van dibujando de forma continua: varias
        // tablas pueden compartir una misma página si el espacio alcanza, y
        // solo se crea una página nueva (plantilla 2) cuando ya no cabe el
        // título + encabezado + al menos una fila de la siguiente tabla.
        if (!empty($perifericos)) {
            $columnasPeriferico = [
                ['header' => 'Nº',              'width' => 8,  'align' => 'C'],
                ['header' => 'Marca',          'width' => 35, 'align' => 'L'],
                ['header' => 'Modelo',         'width' => 35, 'align' => 'L'],
                ['header' => 'Serial',         'width' => 35, 'align' => 'L'],
                ['header' => 'Características', 'width' => 49, 'align' => 'L'],
            ];

            // Agrupar preservando el orden de aparición y el nombre "bonito"
            // (tal como lo escribió el usuario la primera vez).
            $grupos = [];
            foreach ($perifericos as $periferico) {
                $clave = mb_strtolower(trim($periferico['tipo']));

                if (! isset($grupos[$clave])) {
                    $grupos[$clave] = [
                        'titulo' => trim($periferico['tipo']),
                        'items' => [],
                    ];
                }

                $grupos[$clave]['items'][] = $periferico;
            }

            $iniciarPaginaPeriferico = function () use ($pdf) {
                $tpl = $pdf->importPage(2);
                $size = $pdf->getTemplateSize($tpl);
                $pdf->AddPage('P', [$size['width'], $size['height']]);
                $pdf->useTemplate($tpl, 0, 0, $size['width'], $size['height']);

                return $size;
            };

            if($enPagina2 && ($y + $alturaFilaVacia <= $limiteActual)){
                $sizeP = $size2;
                $yP = $y;
                $limiteP = $limiteActual;
            }else{
                $sizeP = $iniciarPaginaPeriferico();
                $yP = 30;
                $limiteP = $sizeP['height'] - 60;
            }

            foreach ($grupos as $grupo) {

                $tituloGrupo = $grupo['titulo'];
                $yP += 4;

                // Verificamos que quepa el título + encabezado + al menos la
                // primera fila del grupo; si no, saltamos a una página nueva.
                $primerItem = $grupo['items'][0];
                $valoresPrimera = [
                    '1',
                    $primerItem['marca'] ?: '—',
                    $primerItem['modelo'] ?: '—',
                    $primerItem['serial'] ?: '—',
                    $primerItem['caracteristicas'] ?: '—',
                ];
                $alturaPrimera = $calcularAlturaFila($valoresPrimera, $columnasPeriferico);
                $alturaTituloYEncabezado = 8 + 6;

                if ($yP + $alturaTituloYEncabezado + $alturaPrimera > $limiteP) {
                    $sizeP = $iniciarPaginaPeriferico();
                    $yP = 30;
                    $limiteP = $sizeP['height'] - 60;
                }

                $dibujarTitulo($tablaX, $yP, $tituloGrupo);
                $yP += 8;
                $dibujarEncabezadoTabla($tablaX, $yP, $columnasPeriferico);
                $yP += 6;

                $numeroGrupo = 1;

                foreach ($grupo['items'] as $item) {
                    $valores = [
                        (string) $numeroGrupo,
                        $item['marca'] ?: '—',
                        $item['modelo'] ?: '—',
                        $item['serial'] ?: '—',
                        $item['caracteristicas'] ?: '—',
                    ];

                    $altura = $calcularAlturaFila($valores, $columnasPeriferico);

                    if ($yP + $altura > $limiteP) {
                        $sizeP = $iniciarPaginaPeriferico();
                        $yP = 30;
                        $limiteP = $sizeP['height'] - 60;

                        $dibujarTitulo($tablaX, $yP, $tituloGrupo . ' (continuación)');
                        $yP += 8;
                        $dibujarEncabezadoTabla($tablaX, $yP, $columnasPeriferico);
                        $yP += 6;
                    }

                    $dibujarFila($tablaX, $yP, $valores, $altura, $columnasPeriferico);
                    $yP += $altura;
                    $numeroGrupo++;
                }
            }
        }

        // ================== PÁGINA FINAL (conclusión y firmas) ==================
        $firmaPath1 = storage_path('app/firmas/roman2.png');
        $firmaPath2 = storage_path('app/firmas/roman.png');
        $tpl3 = $pdf->importPage(3);
        $size3 = $pdf->getTemplateSize($tpl3);
        $pdf->AddPage('P', [$size3['width'], $size3['height']]);
        $pdf->useTemplate($tpl3, 0, 0, $size3['width'], $size3['height']);

        $fechaLabelWidth = 36.67;
        $fechaY = 614.05;
        $fecha1X = 132.94 + $fechaLabelWidth;
        $fecha2X = 374.83 + $fechaLabelWidth;

        $nombreFirma1 = FirmaController::nombreDe('firma1');
        $areaFirma1 = FirmaController::areaDe('firma1');
        $nombreFirma2 = FirmaController::nombreDe('firma2');
        $areaFirma2 = FirmaController::areaDe('firma2');

        // Nombre y área de desempeño
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->SetXY(45, 173);
        $pdf->Cell(40, 4, $nombreFirma1, 0, 1, 'C');
        $pdf->SetXY(130, 173);
        $pdf->Cell(40, 4, $nombreFirma2, 0, 1, 'C');

        $pdf->SetFont('helvetica', '', 11);
        
        $x_izq = 85.04; //Punto de inicio en X
        $y_izq = 507; // Punto de inicio en Y
        $ancho_descrip_izq = 195.6; // El ancho es el diferencial de donde tiene que entrar el texto Y -> 223.94 menos X -> 28.35
        $pdf->MultiCell($ptToMm($ancho_descrip_izq), 6, $areaFirma1, 0, 'C', false, 0, $ptToMm($x_izq), $ptToMm($y_izq));

        $x_der = 313; //Punto de inicio en X
        $y_der = 507; // Punto de inicio en Y
        $ancho_descrip_der = 220.81; // El ancho es el diferencial de donde tiene que entrar el texto Y -> 472.36 menos X -> 251.55
        $pdf->MultiCell($ptToMm($ancho_descrip_der), 6, $areaFirma2, 0 ,'C', false, 0, $ptToMm($x_der), $ptToMm($y_der));
        
        $pdf->SetFont('helvetica', '', 11);

        if (file_exists($firmaPath1) && file_exists($firmaPath2)) {
            // x, y, ancho, alto — se coloca justo encima de la línea "___" y antes de "Fecha:"
            $pdf->Image($firmaPath1, 45, 196, 40, 15, 'PNG', '', '', true, 300);
            $pdf->Image($firmaPath2, 130, 196, 40, 15, 'PNG', '', '', true, 300);
        }

        $pdf->SetXY($ptToMm($fecha1X) + 2, $ptToMm($fechaY));
        $pdf->Cell(30, 4.5, now()->format('d/m/Y'));

        $pdf->SetXY($ptToMm($fecha2X) + 2, $ptToMm($fechaY));
        $pdf->Cell(30, 4.5, now()->format('d/m/Y'));

        $pdf->Output($outputPath, 'F');

        return $outputPath;
    }

    private function buildFilteredEquiposQuery(Request $request, $user): array
    {
        $areaFilter = $request->input('area');

        if ($user->hasRole(Cargo::ADMINISTRADOR->value) && $areaFilter && in_array($areaFilter, array_column(Area::cases(), 'value'))) {
            $allowedAreas = [$areaFilter];
        } else {
            $allowedAreas = $this->getUserAllowedAreas($user);
        }

        $query = Equipo::query()
            ->when(!$user->hasRole(Cargo::ADMINISTRADOR->value) && !empty($allowedAreas), function ($q) use ($allowedAreas) {
                $q->whereIn('area', $allowedAreas);
            });

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('serial', 'ILIKE', "%{$search}%")
                ->orWhere('marca', 'ILIKE', "%{$search}%")
                ->orWhere('modelo', 'ILIKE', "%{$search}%")
                ->orWhere('tipo', 'ILIKE', "%{$search}%");
            });
        }

        if ($request->filled('tipo') && $request->input('tipo') !== 'all') {
            $query->where('tipo', $request->input('tipo'));
        }
        if ($request->filled('condicion') && $request->input('condicion') !== 'all') {
            $query->where('condicion', $request->input('condicion'));
        }
        if ($request->filled('estado_region') && $request->input('estado_region') !== 'all') {
            $estadosBuscados = $request->input('estado_region');
            $query->whereHas('ubicacion', fn ($q) => $q->where('estado', $estadosBuscados));
        }
        if ($request->filled('sede') && $request->input('sede') !== 'all') {
            $sedeBuscada = $request->input('sede');
            $query->whereHas('ubicacion', fn ($q) => $q->where('sede', $sedeBuscada));
        }
        if ($request->filled('piso') && $request->input('piso') !== 'all') {
            $pisoBuscado = $request->input('piso');
            $query->whereHas('ubicacion', fn ($q) => $q->where('piso', $pisoBuscado));
        }
        if ($areaFilter) {
            $query->where('area', $areaFilter);
        }

        return [$query, $areaFilter, $allowedAreas];
    }

    private function generarPdfReporte($equipos, int $total, $porCondicion, $porArea, $porTipo, $porSede, array $filtrosAplicados, $user): string
    {
        $tempDir = 'storage/temp';
        if (!Storage::disk('local')->exists($tempDir)) {
            Storage::disk('local')->makeDirectory($tempDir, 0755, true);
        }

        $fileName = 'reporte_inventario_' . now()->timestamp . '.pdf';
        $outputPath = Storage::disk('local')->path($tempDir . '/' . $fileName);

        $pdf = new FpdiTcpdf('P', 'mm', 'LETTER', true, 'UTF-8', false);
        $pdf->SetCreator('ATIT Orinoco');
        $pdf->SetAuthor($user->name);
        $pdf->SetTitle('Reporte de Inventario');
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(true);
        $pdf->SetMargins(15, 15, 15);
        $pdf->SetAutoPageBreak(true, 15);
        $pdf->AddPage();
        $pdf->SetFont('helvetica', '', 10);

        $filtrosHtml = empty($filtrosAplicados)
            ? '<p><i>Sin filtros aplicados (inventario completo dentro de tu alcance)</i></p>'
            : '<ul>' . implode('', array_map(fn ($f) => "<li>{$f}</li>", $filtrosAplicados)) . '</ul>';

        $html = '<h1 style="color:#194271;">Reporte de Inventario</h1>';
        $html .= '<p><b>Generado por:</b> ' . e($user->name) . ' &nbsp; <b>Fecha:</b> ' . now()->format('d/m/Y H:i') . '</p>';
        $html .= '<p><b>Filtros aplicados:</b></p>' . $filtrosHtml;
        $html .= '<hr>';

        $html .= '<h2>Resumen</h2>';
        $html .= '<table border="1" cellpadding="4">
            <tr style="background-color:#194271;color:#fff;"><td><b>Total de equipos encontrados</b></td><td><b>' . $total . '</b></td></tr>
            <tr><td>Operativos</td><td>' . ($porCondicion['operativo'] ?? 0) . '</td></tr>
            <tr><td>No operativos</td><td>' . ($porCondicion['no_operativo'] ?? 0) . '</td></tr>
        </table>';

        $html .= '<h2>Por área</h2>' . $this->tablaConteo($porArea);
        $html .= '<h2>Por tipo de equipo</h2>' . $this->tablaConteo($porTipo);
        $html .= '<h2>Por sede</h2>' . $this->tablaConteo($porSede);

        $html .= '<h2>Detalle de equipos (' . $total . ')</h2>';
        $html .= '<table border="1" cellpadding="3"><thead><tr style="background-color:#194271;color:#fff;">
            <th width="16.6666%">Tipo</th><th width="16.6666%">Marca</th><th width="16.6666%">Modelo</th>
            <th width="16.6666%">Serial</th><th width="16.6666%">Condición</th><th width="16.6666%">Ubicación</th>
        </tr></thead><tbody>';

        foreach ($equipos as $equipo) {
            $ubicacion = $equipo->ubicacion
                ? ($equipo->ubicacion->sede?->label() ?? '—') . ' / ' . ($equipo->ubicacion->piso?->label() ?? '—')
                : '—';

            $html .= '<tr>
                <td>' . e($equipo->tipo->label()) . '</td>
                <td>' . e($equipo->marca ?? '—') . '</td>
                <td>' . e($equipo->modelo) . '</td>
                <td>' . e($equipo->serial) . '</td>
                <td>' . e($equipo->condicion->label()) . '</td>
                <td>' . e($ubicacion) . '</td>
            </tr>';
        }

        $html .= '</tbody></table>';

        $pdf->writeHTML($html, true, false, true, false, '');
        $pdf->Output($outputPath, 'F');

        return $outputPath;
    }

    private function tablaConteo($coleccion): string
    {
        if ($coleccion->isEmpty()) {
            return '<p><i>Sin datos</i></p>';
        }

        $html = '<table border="1" cellpadding="4"><thead><tr style="background-color:#f0f0f0;">
            <th width="50%">Categoría</th><th width="50%">Cantidad</th>
        </tr></thead><tbody>';

        foreach ($coleccion as $label => $count) {
            $html .= '<tr><td>' . e($label) . '</td><td>' . $count . '</td></tr>';
        }

        return $html . '</tbody></table>';
    }

    private function describirFiltros(Request $request): array
    {
        $descripciones = [];

        if ($request->filled('search')) {
            $descripciones[] = 'Búsqueda: "' . e($request->input('search')) . '"';
        }
        if ($request->filled('tipo') && $request->input('tipo') !== 'all') {
            $descripciones[] = 'Tipo: ' . (TipoEquipo::tryFrom($request->input('tipo'))?->label() ?? $request->input('tipo'));
        }
        if ($request->filled('condicion') && $request->input('condicion') !== 'all') {
            $descripciones[] = 'Condición: ' . (CondicionEquipo::tryFrom($request->input('condicion'))?->label() ?? $request->input('condicion'));
        }
        if ($request->filled('estado_region') && $request->input('estado_region') !== 'all') {
            $descripciones[] = 'Estado/Región: ' . (EstadoRegion::tryFrom($request->input('estado_region'))?->label() ?? $request->input('estado_region'));
        }
        if ($request->filled('sede') && $request->input('sede') !== 'all') {
            $descripciones[] = 'Sede: ' . (Sede::tryFrom($request->input('sede'))?->label() ?? $request->input('sede'));
        }
        if ($request->filled('piso') && $request->input('piso') !== 'all') {
            $descripciones[] = 'Piso: ' . (Piso::tryFrom($request->input('piso'))?->label() ?? $request->input('piso'));
        }
        
        return $descripciones;
    }

    private function formatName(string $value): string
    {
        $value = trim($value);

        return mb_strtoupper(mb_substr($value, 0, 1)) . mb_strtolower(mb_substr($value, 1));
    }

    private function getEstadosRegion(): Collection
    {
        return collect(EstadoRegion::cases())->map(fn($case) => [
            'value' => $case->value,
            'label' => $case->label(),
        ])->values();
    }

    private function getSedes(): Collection
    {
        return collect(Sede::cases())->map(fn($case) => [
            'value' => $case->value,
            'label' => $case->label(),
            'region' => $case->region()->value,
        ])->values();
    }

    private function getPisos(): Collection
    {
        return collect(Piso::cases())->map(fn($case) => [
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
