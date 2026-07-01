<?php

namespace App\Http\Controllers;

use App\Models\HistorialEquipo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class HistorialController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        abort_unless($user->can('ver_historial'), 403);

        $query = HistorialEquipo::with(['usuario', 'equipo.ubicacion']);

        // Filtro por equipo (opcional)
        if ($request->filled('equipo_id') && $request->input('equipo_id') !== 'all') {
            $query->where('equipo_id', $request->input('equipo_id'));
        }

        // Filtro por usuario (opcional)
        if ($request->filled('usuario_id') && $request->input('usuario_id') !== 'all') {
            $query->where('usuario_id', $request->input('usuario_id'));
        }

        // Ordenar por fecha más reciente
        $historial = $query->latest('fecha_ajuste')->paginate(15)->withQueryString();

        // Obtener lista de usuarios y equipos para los filtros (opcional)
        $usuarios = \App\Models\User::select('id', 'name')->get();
        $equipos = \App\Models\Equipo::select('id', 'marca', 'modelo', 'serial')->get();

        return Inertia::render('historial/index', [
            'historial' => $historial,
            'filters'   => $request->only(['equipo_id', 'usuario_id']),
            'usuarios'  => $usuarios,
            'equipos'   => $equipos,
        ]);
    }
}