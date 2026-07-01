<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use App\Models\Ubicacion;
use App\Enums\Area;
use App\Enums\Cargo;
use App\Enums\TipoEquipo;
use App\Enums\EstadoRegion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        // Determinar áreas a las que el usuario tiene acceso
        $allowedAreas = $this->getUserAllowedAreas($user);
        
        // Consulta base de equipos con filtro de áreas
        $query = Equipo::query();
        if (!empty($allowedAreas) && !$user->hasRole(Cargo::ADMINISTRADOR->value)) {
            $query->whereIn('area', $allowedAreas);
        }
        
        // 1. Totales por área
        $totalesPorArea = [];
        $areasInteres = $allowedAreas ?: array_column(Area::cases(), 'value');
        foreach ($areasInteres as $area) {
            $totalesPorArea[$area] = (clone $query)->where('area', $area)->count();
        }
        
        // 2. Equipos por condición (Operativo / No operativo)
        $condiciones = [
            'Operativo' => (clone $query)->where('condicion', 'Operativo')->count(),
            'No operativo' => (clone $query)->where('condicion', 'No operativo')->count(),
        ];
        
        // 3. Últimos 5 equipos agregados (con relaciones básicas)
        $ultimosEquipos = Equipo::with(['ubicacion'])
            ->when(!$user->hasRole(Cargo::ADMINISTRADOR->value) && !empty($allowedAreas), function ($q) use ($allowedAreas) {
                $q->whereIn('area', $allowedAreas);
            })
        ->latest()
        ->limit(5)
        ->get(['id', 'tipo', 'marca', 'modelo', 'serial', 'condicion', 'area', 'ubicacion_id', 'created_at']);
       
        $tiposLabels = [];
        foreach (TipoEquipo::cases() as $tipo) {
            $tiposLabels[$tipo->value] = $tipo->label();
        }

        $estadosLabels = [];
        foreach (EstadoRegion::cases() as $estado) {
            $estadosLabels[$estado->value] = $estado->label();
        }
        
        // 4. Equipos por ubicación (top 5 ubicaciones con más equipos)
        // Obtener las áreas permitidas (si es administrador, todas)
        $areasArray = $allowedAreas ?: array_map(fn($area) => $area->value, Area::cases());

        $equiposPorUbicacion = Ubicacion::select('ubicacions.id', 'ubicacions.estado', 'ubicacions.locacion')
            ->join('equipos', 'ubicacions.id', '=', 'equipos.ubicacion_id')
            ->whereIn('equipos.area', $areasArray)
            ->groupBy('ubicacions.id', 'ubicacions.estado', 'ubicacions.locacion')
            ->selectRaw('COUNT(*) as equipos_count')
            ->havingRaw('COUNT(*) > 0')
            ->orderBy('equipos_count', 'desc')
            ->limit(5)
            ->get();
        
        return Inertia::render('dashboard', [
            'totalesPorArea' => $totalesPorArea,
            'condiciones' => $condiciones,
            'ultimosEquipos' => $ultimosEquipos,
            'equiposPorUbicacion' => $equiposPorUbicacion,
            'tiposLabels' => $tiposLabels,
            'estadosLabels' => $estadosLabels,
        ]);
    }
    
    private function getUserAllowedAreas($user): array
    {
        // Admin ve todo
        if ($user->hasRole(Cargo::ADMINISTRADOR->value)) {
            return array_map(fn($area) => $area->value, Area::cases());
        }

        // Cualquier otro rol solo ve su propia área
        if ($user->area) {
            return [$user->area->value];
        }
        return [];
    }
}