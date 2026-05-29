<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Ubicacion;
use App\Models\UserAsignado;
use App\Models\Infraestructura;
use App\Models\Equipo;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Database\Seeders\RoleSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $ubicaciones = Ubicacion::factory(5)->create();
 
        $asignados = UserAsignado::factory(10)->create();

        Equipo::factory(35)->infraestructura()->afterMaking(function ($equipo) use ($ubicaciones){
            $equipo->ubicacion_id = $ubicaciones->random()->id;
            })->create()->each(function($equipo) use ($asignados){
                Infraestructura::factory()->create([
                    'id' => $equipo->id,
                    'asignado_id' => $asignados->random()->cedula,
                ]);
            });

        User::factory()->create([
            'name' => 'Anthony Medina',
            'email' => 'testfirst@gmail.com',
            'password' => '123456ml'
        ]);

        $this->call([
            RoleSeeder::class
        ]);
        
    }
}
