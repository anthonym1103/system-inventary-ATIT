<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;


class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions =[
            'sector infraestructura',
            'sector redes',
            'sector transmision'
        ];

        foreach($permissions as $permissionName){
            Permission::create(['name' => $permissionName]);
        }

        $roleAdmin = Role::create(['name' => 'Administrador']);
        $roleInfra = Role::create(['name' => 'Tecnico de Infraestructura']);
        $roleRedes = Role::create(['name' => 'Tecnico de Redes y Telecomunicaciones']);
        $roleTransm = Role::create(['name' => 'Tecnico de Transmision de Datos']);

        $roleAdmin->givePermissionTo($permissions); //Permiso para ver todos los sectores
        $roleInfra->givePermissionTo($permissions[0]); //Permiso para ver el sector de infraestructura
        $roleRedes->givePermissionTo($permissions[1]); //Permiso Para ver el sector de redes y telecomunicaciones
        $roleTransm->givePermissionTo($permissions[2]); //Permiso para ver el sector de transmision de datos

    }
}
