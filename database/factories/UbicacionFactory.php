<?php

namespace Database\Factories;

use App\Models\Ubicacion;
use App\Enums\EstadoRegion;
use App\Enums\Sede;
use App\Enums\Piso;
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


    public function definition(): array
    {
        $estado = fake()->randomElement(EstadoRegion::cases());
        return [
            'estado' => fake()->randomElement(EstadoRegion::cases())->value,
            'sede' => fake()->randomElement(Sede::cases())->value,
            'piso' => fake()->randomElement(Piso::cases())->value,
        ];
    }
}
