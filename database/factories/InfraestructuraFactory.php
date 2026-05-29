<?php

namespace Database\Factories;

use App\Models\Infraestructura;
use App\Models\UserAsignado;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Infraestructura>
 */
class InfraestructuraFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */

    protected $model = Infraestructura::class;

    public function definition(): array
    {

        return [
            'asignado_id' => UserAsignado::inRandomOrder()->first()?->cedula ?? UserAsignado::factory(),
            'anio' => (string) fake()->year(),
            'ram' => fake()->randomElement(['2GB','4GB','8GB','16GB']),
            'disco' => fake()->randomElement(['256GB SSD','512GB SSD','256GB HDD']),
            'direccion_mac' => fake()->macAddress(),
            'sistema_operativo' => fake()->randomElement(['Windows 10','Windows 7','Windows 11']),
            'numero_inventario' => fake()->unique()->numerify('INV-####'),
            'dominio' => fake()->domainName(),
            'unidad' => fake()->word(),
    
        ];
    }
}
