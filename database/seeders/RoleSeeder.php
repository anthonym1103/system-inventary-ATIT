<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use App\Models\User;
use App\Enums\Area;

class RoleSeeder extends Seeder
{

    // Posibles cargos por área (jerarquía)
    private array $cargos = ['administrador','supervisor','tecnico'];

    // Permisos base que se pueden granular después
    private array $permisosBase = [
        'ver_equipos',
        'crear_equipos',
        'editar_equipos',
        'eliminar_equipos',
        'ver_historial',
        'crear_usuarios',
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
        foreach ($areas as $area) {
            foreach ($this->cargos as $cargo) {
                $roleName = "{$cargo}_{$area->value}";
                $role = Role::create(['name' => $roleName]);

                // Asignar permisos según el cargo (definición de jerarquía)
                $this->assignPermissionsToRole($role, $cargo);
            }
        }


        $adminRole = Role::create(['name' => 'Administrador']);
        $adminRole->givePermissionTo(Permission::all());

        //Creamos roles a usuarios de prueba
        $this->assignRolesToTestUsers();
    }

    private function assignPermissionsToRole(Role $role, string $cargo): void
    {
        // Aquí defines qué permisos tiene cada cargo
        switch ($cargo) {
            case 'administrador':
                // Supervisor tiene todos los permisos de su área
                $permisosAsignar = [
                    "ver_equipos",
                    "ver_historial",
                    "crear_usuarios",
                    "asignar_roles",
                ];
                break;
            case 'supervisor':
                // Supervisor tiene todos los permisos de su área
                $permisosAsignar = [
                    "ver_equipos",
                    "ver_historial",
                ];
                break;
            case 'tecnico':
                $permisosAsignar = [
                    "ver_equipos",
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
            if($user->area === Area::INFRAESTRUCTURA->value){
                $user->assignRole('administrador_infraestructura');
            }elseif ($user->area === Area::REDES->value){
                $user->assignRole('administrador_redes');
            }else{
                $user->assignRole('administrador_transmision_datos');
            }
        }
    }

    //esperanza problema en el corporativo con el equipo

    //irisbel se llevo un cable
}

