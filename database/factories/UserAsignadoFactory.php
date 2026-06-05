<?php

namespace Database\Factories;

use App\Models\UserAsignado;
use Illuminate\Database\Eloquent\Factories\Factory;


/**
 * @extends Factory<UserAsignado>
 */
class UserAsignadoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */

    protected $model = UserAsignado::class;

    public function definition(): array
    {
        return [
            'cedula' => fake()->unique()->numerify('V########'),
            'nombre' => fake()->firstName(),
            'apellido' => fake()->lastName(),
            'telefono' => fake()->unique()->numerify('+58041########'),
            'gerencia' => fake()->randomElement(['Gerencia ATIT', 'Gerencia de Operaciones']),
        ];
    }
}
