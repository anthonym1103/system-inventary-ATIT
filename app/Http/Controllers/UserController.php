<?php

namespace App\Http\Controllers;

use App\Enums\Area;
use App\Enums\Cargo;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    private array $areaLabels = [
        'infraestructura' => 'Infraestructura',
        'redes' => 'Redes',
        'transmision_datos' => 'Transmisión de Datos',
    ];

    private array $cargoLabels = [
        'supervisor' => 'Supervisor',
        'tecnico' => 'Técnico',
    ];

    public function index(Request $request): Response
    {
        // Basado en permiso, no en nombre de rol
        abort_unless(Auth::user()->can('asignar_roles'), 403);

        $query = User::query()->with('roles');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('user_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->latest()->paginate(10)->withQueryString();

        //dump($users);

        $users->getCollection()->transform(fn (User $user) => [
            'id' => $user->id,
            'name' => $user->name,
            'user_name' => $user->user_name,
            'email' => $user->email,
            'area' => $user->area?->value,
            'avatar' => $user?->avatar,
            'role' => $user->roles->first()?->name,
            'email_verified_at' => $user->email_verified_at,
        ]);

        return Inertia::render('usuarios/index', [
            'users' => $users,
            'rolesByArea' => $this->rolesByArea(),
            'areaLabels' => $this->areaLabels,
            'filters' => $request->only(['search']),
        ]);
    }

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        $authUser = Auth::user();

        abort_unless($authUser->can('asignar_roles'), 403);

        if ($user->id === $authUser->id) {
            abort(403, 'No puedes modificar tu propio rol.');
        }

        // Solo puede asignar supervisor o tecnico dentro del área del usuario
        // No puede promover a Administrador desde esta pantalla
        if (! $user->area) {
            abort(422, 'El usuario no tiene área asignada.');
        }

        $allowedRoles = collect([Cargo::SUPERVISOR, Cargo::TECNICO])
            ->map(fn (Cargo $cargo) => "{$cargo->value}_{$user->area->value}")
            ->toArray();

        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in($allowedRoles)],
        ]);

        $user->syncRoles([$validated['role']]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Rol actualizado correctamente.']);

        return back();
    }

    private function rolesByArea(): array
    {
        $rolesByArea = [];

        foreach (Area::cases() as $area) {
            // Solo supervisor y tecnico — el admin no se asigna desde aquí
            $rolesByArea[$area->value] = collect([Cargo::SUPERVISOR, Cargo::TECNICO])
                ->map(fn (Cargo $cargo) => [
                    'value' => "{$cargo->value}_{$area->value}",
                    'label' => $this->cargoLabels[$cargo->value],
                ])
                ->values()
                ->toArray();
        }

        return $rolesByArea;
    }
}