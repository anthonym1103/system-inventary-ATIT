<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use App\Models\HistorialEquipo;
use App\Models\Infraestructura;
use App\Models\Ubicacion;
use App\Models\UserAsignado;
use App\Enums\Area;
use App\Enums\TipoEquipo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class EquipoController extends Controller
{
    /**
     * Listado de equipos (con búsqueda, filtros y paginación).
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Equipo::query();

        // 1. Filtrar por área según los permisos del usuario
        $allowedAreas = $this->getUserAllowedAreas($user);
        if (!empty($allowedAreas) && !$user->hasRole('Administrador')) {
            $query->whereIn('area', $allowedAreas);
        }

        // 2. Búsqueda libre (marca, modelo, serial, tipo)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('marca', 'like', "%{$search}%")
                  ->orWhere('modelo', 'like', "%{$search}%")
                  ->orWhere('serial', 'like', "%{$search}%")
                  ->orWhere('tipo', 'like', "%{$search}%");
            });
        }

        // 3. Filtro por condición
        if ($request->filled('condicion')) {
            $query->where('condicion', $request->condicion);
        }

        // 4. Filtro por ubicación
        if ($request->filled('ubicacion_id')) {
            $query->where('ubicacion_id', $request->ubicacion_id);
        }

        // 5. Cargar relaciones necesarias para la tabla
        $query->with(['ubicacion', 'infraestructura.userAsignado']);

        $equipos = $query->paginate(15)->withQueryString();

        return Inertia::render('equipos/Index', [
            'equipos' => $equipos,
            'filters' => $request->only(['search', 'condicion', 'ubicacion_id']),
            'canCreate' => $user->hasAnyPermission(['area_infraestructura', 'area_redes', 'area_transmision']),
            'ubicaciones' => Ubicacion::all(['id', 'estado', 'locacion']),
        ]);
    }

    /**
     * Muestra el formulario de creación.
     */
    public function create()
    {
        $user = Auth::user();
        $allowedAreas = $this->getUserAllowedAreas($user);

        if (empty($allowedAreas)) {
            return redirect()->route('equipos.index')
                ->with('error', 'No tienes permiso para crear equipos.');
        }

        $tiposDisponibles = [];
        foreach (TipoEquipo::cases() as $tipo) {
            if (in_array($tipo->modulo()->value, $allowedAreas)) {
                $tiposDisponibles[] = [
                    'value' => $tipo->value,
                    'label' => $tipo->label(),
                    'area' => $tipo->modulo()->value,
                ];
            }
        }

        return Inertia::render('equipos/Create', [
            'ubicaciones' => Ubicacion::all(['id', 'estado', 'locacion']),
            'areas' => array_map(fn($area) => ['value' => $area, 'label' => $area], $allowedAreas),
            'tipos' => $tiposDisponibles,
            'condiciones' => [
                ['value' => 'Operativo', 'label' => 'Operativo'],
                ['value' => 'No operativo', 'label' => 'No operativo'],
            ],
        ]);
    }

    /**
     * Almacena un nuevo equipo y su infraestructura si aplica.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $allowedAreas = $this->getUserAllowedAreas($user);

        // Validación común del equipo
        $rules = [
            'ubicacion_id' => 'required|exists:ubicacions,id',
            'area' => 'required|string|in:' . implode(',', $allowedAreas),
            'tipo' => 'required|string',
            'condicion' => 'required|string|in:Operativo,No operativo',
            'marca' => 'required|string|max:255',
            'modelo' => 'required|string|max:255',
            'serial' => 'required|string|unique:equipos,serial',
            'detalle' => 'nullable|string',
        ];

        // Si el área es Infraestructura, añadir validaciones de infraestructura
        if ($request->area === Area::INFRAESTRUCTURA->value) {
            $rules = array_merge($rules, [
                'asignado' => 'nullable|exists:user_asignados,cedula',
                'año' => 'nullable|string',
                'ram' => 'nullable|string',
                'disco' => 'nullable|string',
                'direccion_mac' => 'nullable|string',
                'sistema_operativo' => 'nullable|string',
                'numero_inventario' => 'nullable|string',
                'dominio' => 'nullable|string',
                'unidad' => 'nullable|string',
            ]);
        }

        $validated = $request->validate($rules);

        // Crear equipo
        $equipo = Equipo::create($request->only([
            'ubicacion_id', 'area', 'tipo', 'condicion', 'marca', 'modelo', 'serial', 'detalle'
        ]));

        // Si es infraestructura, crear el registro relacionado
        if ($request->area === Area::INFRAESTRUCTURA->value) {
            Infraestructura::create([
                'id' => $equipo->id,
                'asignado' => $request->asignado,
                'año' => $request->año,
                'ram' => $request->ram,
                'disco' => $request->disco,
                'direccion_mac' => $request->direccion_mac,
                'sistema_operativo' => $request->sistema_operativo,
                'numero_inventario' => $request->numero_inventario,
                'dominio' => $request->dominio,
                'unidad' => $request->unidad,
            ]);
        }

        // Registrar historial de creación
        HistorialEquipo::create([
            'usuario_id' => $user->id,
            'equipo_id' => $equipo->id,
            'detalle' => 'Equipo creado',
            'fecha_ajuste' => now(),
        ]);

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo creado exitosamente.');
    }

    /**
     * Muestra un equipo específico con todas sus relaciones.
     */
    public function show(Equipo $equipo)
    {
        $user = Auth::user();
        $this->authorizeArea($user, $equipo->area);

        $equipo->load([
            'ubicacion',
            'infraestructura.userAsignado',
            'historialEquipos.usuario'
        ]);

        return Inertia::render('equipos/Show', [
            'equipo' => $equipo,
        ]);
    }

    /**
     * Muestra el formulario de edición.
     */
    public function edit(Equipo $equipo)
    {
        $user = Auth::user();
        $this->authorizeArea($user, $equipo->area);

        $equipo->load('infraestructura');

        // Tipos permitidos para esta área
        $tiposDisponibles = [];
        foreach (TipoEquipo::cases() as $tipo) {
            if ($tipo->modulo()->value === $equipo->area) {
                $tiposDisponibles[] = [
                    'value' => $tipo->value,
                    'label' => $tipo->label(),
                ];
            }
        }

        return Inertia::render('equipos/Edit', [
            'equipo' => $equipo,
            'ubicaciones' => Ubicacion::all(['id', 'estado', 'locacion']),
            'tipos' => $tiposDisponibles,
            'condiciones' => [
                ['value' => 'Operativo', 'label' => 'Operativo'],
                ['value' => 'No operativo', 'label' => 'No operativo'],
            ],
            'asignados' => $equipo->area === Area::INFRAESTRUCTURA->value
                ? UserAsignado::all(['cedula', 'nombre', 'apellido'])
                : [],
        ]);
    }

    /**
     * Actualiza el equipo y su infraestructura si corresponde.
     */
    public function update(Request $request, Equipo $equipo)
    {
        $user = Auth::user();
        $this->authorizeArea($user, $equipo->area);

        // Reglas base
        $rules = [
            'ubicacion_id' => 'sometimes|exists:ubicacions,id',
            'condicion' => 'sometimes|string|in:Operativo,No operativo',
            'marca' => 'sometimes|string|max:255',
            'modelo' => 'sometimes|string|max:255',
            'serial' => 'sometimes|string|unique:equipos,serial,' . $equipo->id,
            'detalle' => 'nullable|string',
        ];

        // Si el equipo pertenece a infraestructura, añadir reglas de infraestructura
        if ($equipo->area === Area::INFRAESTRUCTURA->value) {
            $rules = array_merge($rules, [
                'asignado' => 'nullable|exists:user_asignados,cedula',
                'año' => 'nullable|string',
                'ram' => 'nullable|string',
                'disco' => 'nullable|string',
                'direccion_mac' => 'nullable|string',
                'sistema_operativo' => 'nullable|string',
                'numero_inventario' => 'nullable|string',
                'dominio' => 'nullable|string',
                'unidad' => 'nullable|string',
            ]);
        }

        $validated = $request->validate($rules);

        // Actualizar campos del equipo
        $equipo->update($request->only([
            'ubicacion_id', 'condicion', 'marca', 'modelo', 'serial', 'detalle'
        ]));

        // Manejar infraestructura
        if ($equipo->area === Area::INFRAESTRUCTURA->value) {
            $infra = $equipo->infraestructura ?: new Infraestructura(['id' => $equipo->id]);
            $infra->fill($request->only([
                'asignado', 'año', 'ram', 'disco', 'direccion_mac', 'sistema_operativo',
                'numero_inventario', 'dominio', 'unidad'
            ]));
            $infra->save();
        } else {
            // Si no es infraestructura pero tiene un registro huérfano, lo eliminamos
            if ($equipo->infraestructura) {
                $equipo->infraestructura->delete();
            }
        }

        // El historial de cambios se registra automáticamente mediante el evento `updating` del modelo.
        // Si prefieres hacerlo manualmente, descomenta el bloque comentado en el modelo y elimina el evento.

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo actualizado correctamente.');
    }

    /**
     * Elimina el equipo (y su infraestructura por cascade).
     */
    public function destroy(Equipo $equipo)
    {
        $user = Auth::user();
        $this->authorizeArea($user, $equipo->area);

        // Registrar en historial antes de eliminar
        HistorialEquipo::create([
            'usuario_id' => $user->id,
            'equipo_id' => $equipo->id,
            'detalle' => 'Equipo eliminado',
            'fecha_ajuste' => now(),
        ]);

        $equipo->delete();

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo eliminado.');
    }

    /**
     * Devuelve las áreas (valores) a las que el usuario tiene permiso.
     */
    private function getUserAllowedAreas($user): array
    {
        $areas = [];
        if ($user->hasPermissionTo('area_infraestructura')) {
            $areas[] = Area::INFRAESTRUCTURA->value;
        }
        if ($user->hasPermissionTo('area_redes')) {
            $areas[] = Area::REDES->value;
        }
        if ($user->hasPermissionTo('area_transmision')) {
            $areas[] = Area::TRANSMISION->value;
        }
        // Si es administrador, devolvemos todas las áreas
        if ($user->hasRole('Administrador')) {
            return array_map(fn($area) => $area->value, Area::cases());
        }
        return $areas;
    }

    /**
     * Lanza una excepción 403 si el usuario no tiene permiso para el área del equipo.
     */
    private function authorizeArea($user, string $area)
    {
        $permiso = 'area_' . strtolower(str_replace(' ', '_', $area));
        if (!$user->hasPermissionTo($permiso) && !$user->hasRole('Administrador')) {
            abort(403, 'No tienes permiso para acceder a este equipo.');
        }
    }
}
