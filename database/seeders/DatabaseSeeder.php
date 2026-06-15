<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Ubicacion;
use App\Models\UserAsignado;
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

        Equipo::factory(35)->afterMaking(function ($equipo) use ($ubicaciones, $asignados){
            $equipo->ubicacion_id = $ubicaciones->random()->id;
            if($equipo->area->value === 'infraestructura' || $equipo->tipo->value === 'telefono_analogico' || $equipo->tipo->value === 'telefono_digital'){
                $equipo->asignado_id = $asignados->random()->cedula;
            }else{
                $equipo->asignado_id = null;
            }
            })->create();

        User::factory()->create([
            'name' => 'Anthony Medina',
            'user_name' => 'anthonyml03',
            'email' => 'testfirst@gmail.com',
            'password' => '123456ml'
        ]);

        $this->call([
            RoleSeeder::class
        ]);
        
    }
}
