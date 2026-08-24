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

        $ubicaciones = Ubicacion::factory(20)->create();

        $asignados = UserAsignado::factory(30)->create();

        // NOTA: "tipo" ya no está casteado a TipoEquipo en el modelo Equipo,
        // así que en memoria (afterMaking, antes de guardar) es un string
        // plano. Antes se comparaba con $equipo->tipo->value; ahora se
        // compara el string directamente.
        Equipo::factory(300)->afterMaking(function ($equipo) use ($ubicaciones, $asignados) {
            $equipo->ubicacion_id = $ubicaciones->random()->id;

            $tiposConEncargado = ['micro_escritorio', 'portatil', 'telefono_analogico', 'telefono_digital'];

            if (in_array($equipo->tipo, $tiposConEncargado, true)) {
                $equipo->asignado_id = $asignados->random()->cedula;
            } else {
                $equipo->asignado_id = null;
            }
        })->create();

        User::factory()->create([
            'name' => 'Anthony Medina',
            'user_name' => 'anthonyml03',
            'email' => 'testfirst@gmail.com',
            'password' => '123456ml',
            'area' => null,
        ]);

        $this->call([
            RoleSeeder::class,
        ]);
    }
}