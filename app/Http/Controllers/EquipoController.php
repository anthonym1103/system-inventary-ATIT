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
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class EquipoController extends Controller
{
    
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // 1. Determinar áreas permitidas (igual que en DashboardController)
        $allowedAreas = $this->getUserAllowedAreas($user);
        
        // 2. Query base con filtro de áreas
        $query = Equipo::query()
            ->with(['ubicacion', 'userAsignado'])
            ->when(!$user->hasRole('Administrador') && !empty($allowedAreas), function ($q) use ($allowedAreas) {
                $q->whereIn('area', $allowedAreas);
            });
        
        // 3. Búsqueda por texto (serial, marca, modelo, tipo)
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('serial', 'LIKE', "%{$search}%")
                  ->orWhere('marca', 'LIKE', "%{$search}%")
                  ->orWhere('modelo', 'LIKE', "%{$search}%")
                  ->orWhere('tipo', 'LIKE', "%{$search}%");
            });
        }
        
        // 4. Filtros adicionales (por tipo, condición, ubicación)
        if ($request->filled('tipo')) {
            $query->where('tipo', $request->input('tipo'));
        }
        if ($request->filled('condicion')) {
            $query->where('condicion', $request->input('condicion'));
        }
        if ($request->filled('ubicacion_id')) {
            $query->where('ubicacion_id', $request->input('ubicacion_id'));
        }
        
        // 5. Paginación (10 por página, puedes cambiar)
        $equipos = $query->latest()->paginate(10)->withQueryString();
        
        // 6. Datos para filtros (tipos, condiciones, ubicaciones)
        $tiposLabels = [];
        foreach (TipoEquipo::cases() as $tipo) {
            $tiposLabels[$tipo->value] = $tipo->label();
        }
        
        // Solo mostrar ubicaciones que tengan equipos en las áreas permitidas
        $ubicaciones = Ubicacion::whereHas('equipos', function ($q) use ($allowedAreas, $user) {
            if (!$user->hasRole('Administrador') && !empty($allowedAreas)) {
                $q->whereIn('area', $allowedAreas);
            }
        })->get(['id', 'estado', 'locacion']);
        
        // 7. Obtener permisos del usuario para acciones (opcional)
        $permissions = [
            'can_create' => $user->can('crear_equipos'),
            'can_edit'   => $user->can('editar_equipos'),
            'can_delete' => $user->can('eliminar_equipos'),
        ];
        
        return Inertia::render('equipos/index', [
            'equipos' => $equipos,
            'tiposLabels' => $tiposLabels,
            'condiciones' => CondicionEquipo::cases(),
            'ubicaciones' => $ubicaciones,
            'filters' => $request->only(['search', 'tipo', 'condicion', 'ubicacion_id']),
            'permissions' => $permissions,
        ]);

    }
  
    public function store(Request $request)
    {
        
    }

    
    public function show(Equipo $equipo)
    {
        
    }

   
    public function update(Request $request, Equipo $equipo)
    {
        
    }

   
    public function destroy(Equipo $equipo)
    {
        
    }


    private function getUserAllowedAreas($user): array
    {
        if ($user->hasRole('Administrador')) {
            return array_map(fn($area) => $area->value, Area::cases());
        }
        
        $areas = [];
        if ($user->area && in_array($user->area->value, ['infraestructura', 'redes', 'transmision_datos'])) {
            $areas[] = $user->area->value;
        }
        return $areas;
    }

   
}