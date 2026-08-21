<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use App\Models\User;
use App\Enums\Area;
use App\Enums\Cargo;

class RoleSeeder extends Seeder
{

    // Permisos base que se pueden granular después
    private array $permisosBase = [
        'crear_equipos',
        'editar_equipos',
        'eliminar_equipos',
        'ver_historial',
        'gestionar_notiMantenimiento',
        'asignar_roles',
    ];

    public function run(): void
    {
        //Limpiamos caché de permisos
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        //Creamos permisos para cada área + acción
        foreach($this->permisosBase as $permissionName){
            Permission::create(['name' => $permissionName]);
        }

        //Creamos roles combinando cargo + área
        $areas = Area::cases();
        $cargosDeArea = [Cargo::SUPERVISOR, Cargo::TECNICO];

        foreach ($areas as $area) {
            foreach ($cargosDeArea as $cargo) {
                $roleName = "{$cargo->value}_{$area->value}";
                $role = Role::create(['name' => $roleName]);

                // Asignar permisos según el cargo (definición de jerarquía)
                $this->assignPermissionsToRole($role, $cargo->value, $cargosDeArea);
            }
        }

        $adminRole = Role::firstOrCreate(['name' => Cargo::ADMINISTRADOR->value]);
        $adminRole->syncPermissions([
                'ver_historial',
                'asignar_roles',
                'gestionar_notiMantenimiento',
                'eliminar_equipos',
                ],);

        //Creamos roles a usuarios de prueba
        $this->assignRolesToTestUsers();
    }

    private function assignPermissionsToRole(Role $role, string $cargo, array $cargos): void
    {
        
        // Aquí se define qué permisos tiene cada cargo
        $permisos = match ($cargo) {
            Cargo::SUPERVISOR->value => [
                'ver_historial',
                'gestionar_notiMantenimiento',
                ],
            Cargo::TECNICO->value => [
                'crear_equipos', 
                'editar_equipos', 
                'ver_historial',
                ],
            default => [],
        };

        $role->syncPermissions($permisos);
    }

    private function assignRolesToTestUsers(): void
    {
        $user = User::where('email', 'testfirst@gmail.com')->first();
        if ($user) {
            $user->syncRoles([Cargo::ADMINISTRADOR->value]);
        }
    }

    //esperanza problema en el corporativo con el equipo

    //irisbel se llevo un cable
}

