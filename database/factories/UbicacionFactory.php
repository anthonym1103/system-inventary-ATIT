<?php

namespace Database\Factories;

use App\Models\Ubicacion;
use App\Enums\EstadoRegion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ubicacion>
 */
class UbicacionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */

    protected $model = Ubicacion::class;

    public function definition(): array
    {
        return [
            'estado' => fake()->randomElement(EstadoRegion::cases())->value,
            'locacion' => fake()->city(),
        ];
    }
}
