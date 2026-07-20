<?php

namespace App\Http\Controllers;

use App\Models\HistorialEquipo;
use App\Models\User;
use App\Models\Equipo;
use App\Enums\TipoEquipo;
use App\Enums\Cargo;
use App\Enums\Area;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class HistorialController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        abort_unless($user->can('ver_historial'), 403);

        $allowedAreas = $this->getUserAllowedAreas($user);

        $query = HistorialEquipo::with(['usuario', 'equipo.ubicacion'])
            ->when(!empty($allowedAreas), function ($q) use ($allowedAreas) {
                $q->whereHas('equipo', function ($eq) use ($allowedAreas) {
                    $eq->whereIn('area', $allowedAreas);
                });
            });

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search){
                $q->whereHas('equipo', function ($eq) use ($search) {
                    $eq->where('serial', 'ILIKE', "%{$search}%");
                })->orWhereHas('usuario',function ($eq) use ($search){
                    $eq->where('name', 'ILIKE', "%{$search}%")
                        ->orWhere('user_name', 'ILIKE', "%{$search}%");
                });
            });
            
        }

        if ($request->filled('tipo') && $request->input('tipo') !== 'all') {
            $search = $request->input('tipo');
            $query->where(function ($q) use ($search){
                $q->whereHas('equipo', function($eq) use($search){
                    $eq->where('tipo', $search);
                });
            });
        }

        // Ordenar por fecha más reciente
        $historial = $query->latest('fecha_ajuste')->paginate(15)->onEachSide(1)->withQueryString();

        $tiposLabels = [];
        foreach (TipoEquipo::cases() as $tipo) {
            if (empty($allowedAreas) || in_array($tipo->modulo()->value, $allowedAreas)) {
                $tiposLabels[$tipo->value] = $tipo->label();
            }
        }
        
        // Usuarios: solo los que han hecho cambios sobre equipos visibles para este usuario
        /*$usuarios = User::whereHas('historialEquipos', function ($q) use ($allowedAreas) {
            $q->whereHas('equipo', function ($eq) use ($allowedAreas) {
                $eq->whereIn('area', $allowedAreas);
            });
        })->select('id', 'name')->get();*/

        // Equipos: solo los del área permitida
        /*$equipos = Equipo::query()
            ->when(!empty($allowedAreas), function ($q) use ($allowedAreas) {
                $q->whereIn('area', $allowedAreas);
            })
            ->select('id','tipo','serial')
            ->get();
        */

        return Inertia::render('historial/index', [
            'historial' => $historial,
            'filters'   => $request->only(['search','tipo']),
            'tiposLabels' => $tiposLabels
        ]);
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
} 