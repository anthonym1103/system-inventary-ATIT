<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Notificacion;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $notificaciones = [];
        $pendientesCount = 0;

        if ($user) {
            $notificaciones = Notificacion::with(
                    'equipo:id,ubicacion_id,tipo,marca,modelo,serial', 
                    'equipo.ubicacion:id,estado,piso,sede')
                ->where('usuario_id', $user->id)
                ->where('fecha_mantenimiento', '<=', now()->toDateString())
                ->orderBy('fecha_mantenimiento')
                ->orderBy('leido') // para que las no leídas aparezcan primero (opcional)
                ->get();

            $pendientesCount = $notificaciones->where('leido', false)->count();
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                'permissions' => $request->user()?->getAllPermissions()->pluck('name') ?? [],
                'role' => $request->user()?->getRoleNames()->first(),
            ],
            'notificaciones' => $notificaciones,
            'notificacionesPendientes' => $pendientesCount,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
