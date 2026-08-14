<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use App\Models\Ubicacion;
use App\Enums\Area;
use App\Enums\Cargo;
use App\Enums\TipoEquipo;
use App\Enums\EstadoRegion;
use App\Enums\CondicionEquipo;
use App\Enums\Sede;
use App\Enums\Piso;
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
            'operativo' => (clone $query)->where('condicion', 'operativo')->count(),
            'no_operativo' => (clone $query)->where('condicion', 'no_operativo')->count(),
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
        
        // 4. Equipos por ubicación (top 5 ubicaciones con más equipos)
        // Obtener las áreas permitidas (si es administrador, todas)
        $areasArray = $allowedAreas ?: array_map(fn($area) => $area->value, Area::cases());

        $totalEquiposEnAlcance = (clone $query)->count();

        $equiposPorUbicacion = Ubicacion::select('ubicacions.id', 'ubicacions.estado', 'ubicacions.sede', 'ubicacions.piso')
            ->join('equipos', 'ubicacions.id', '=', 'equipos.ubicacion_id')
            ->whereIn('equipos.area', $areasArray)
            ->groupBy('ubicacions.id', 'ubicacions.estado', 'ubicacions.sede', 'ubicacions.piso')
            ->selectRaw('COUNT(*) as equipos_count')
            ->havingRaw('COUNT(*) > 0')
            ->orderBy('equipos_count', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) use ($totalEquiposEnAlcance) {
                $item->porcentaje = $totalEquiposEnAlcance > 0
                    ? round(($item->equipos_count / $totalEquiposEnAlcance) * 100, 1)
                    : 0;

                return $item;
            });
        
        return Inertia::render('dashboard', [
            'totalesPorArea' => $totalesPorArea,
            'condiciones' => $condiciones,
            'ultimosEquipos' => $ultimosEquipos,
            'equiposPorUbicacion' => $equiposPorUbicacion,
            'tiposLabels' => $tiposLabels,
            'estadosLabels' => $estadosLabels,
            'sedesLabels' => $sedesLabels,
            'pisosLabels' => $pisosLabels,
            'condicionesLabels' => $condicionesLabels,
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