<?php

namespace Database\Factories;

use App\Models\Transmision;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Transmision>
 */
class TransmisionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */

    protected $model = Transmision::class;

    public function definition(): array
    {
        return [
            'potencia' => fake()->unique()->numerify('####'),
            'rango_frecuencia' => fake()->numerify('###Ghz'),
            'unidad_usuario' => fake()->name(),
            'caracteristicas' => fake()->sentence(),
            'numero_inventario' => fake()->unique()->numerify('Inv-####')
        ];
    }
}
