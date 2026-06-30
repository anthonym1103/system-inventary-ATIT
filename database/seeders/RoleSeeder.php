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
        $cargos = Cargo::cases();
        foreach ($areas as $area) {
            foreach ($cargos as $cargo) {
                $roleName = "{$cargo->value}_{$area->value}";
                $role = Role::create(['name' => $roleName]);

                // Asignar permisos según el cargo (definición de jerarquía)
                $this->assignPermissionsToRole($role, $cargo->value, $cargos);
            }
        }


        $adminRole = Role::create(['name' => 'Administrador']);
        $adminRole->givePermissionTo(Permission::all());

        //Creamos roles a usuarios de prueba
        $this->assignRolesToTestUsers();
    }

    private function assignPermissionsToRole(Role $role, string $cargo, array $cargos): void
    {
        

        // Aquí defines qué permisos tiene cada cargo
        switch ($cargo) {
            case $cargos[0]->value:
                // Permisos de administrador
                $permisosAsignar = [
                    "ver_historial",
                    "asignar_roles",
                ];
                break;
            case $cargos[1]->value:
                //Permisos de supervisor
                $permisosAsignar = [
                    "ver_historial",
                ];
                break;
            case $cargos[2]->value:
                //Permisos de tecnico
                $permisosAsignar = [
                    "crear_equipos",
                    "editar_equipos",
                    "eliminar_equipos",
                    "ver_historial",
                ];
                break;
            default:
                $permisosAsignar = [];
        }

        $role->givePermissionTo($permisosAsignar);
    }

    private function assignRolesToTestUsers(): void
    {
        $user = User::where('email', 'testfirst@gmail.com')->first();
        if ($user ) {
            if($user->area->value === Area::INFRAESTRUCTURA->value){
                $user->assignRole('administrador_infraestructura');
            }elseif ($user->area->value === Area::REDES->value){
                $user->assignRole('administrador_redes');
            }else{
                $user->assignRole('administrador_transmision_datos');
            }
        }
    }

    //esperanza problema en el corporativo con el equipo

    //irisbel se llevo un cable
}

