<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use App\Models\Notificacion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;


class NotificacionController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'equipo_id' => ['required', 'integer', 'exists:equipos,id'],
            'fecha_mantenimiento' => ['required', 'date', 'after_or_equal:today'],
            'detalle' => ['nullable', 'string', 'max:255'],
        ]);

        $equipo = Equipo::findOrFail($validated['equipo_id']);

        $this->authorizeAreaAccess($user, $equipo);

        Notificacion::create([
            'equipo_id' => $equipo->id,
            'usuario_id' => $user->id,
            'fecha_mantenimiento' => $validated['fecha_mantenimiento'],
            'detalle' => $validated['detalle'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Recordatorio de mantenimiento programado.']);

        return back();
    }

    public function markAsRead(Notificacion $mantenimiento): RedirectResponse
    {
        abort_unless($mantenimiento->usuario_id === Auth::id(), 403);

        $mantenimiento->update(['leido' => true]);

        return back();
    }

    private function authorizeAreaAccess($user, Equipo $equipo): void
    {
        if ($user->hasRole('Administrador')) {
            return;
        }

        abort_unless(
            $user->area && $user->area->value === $equipo->area->value,
            403,
            'No tienes acceso a este equipo.'
        );
    }
}
