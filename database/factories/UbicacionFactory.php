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

        // 2. Filtra las sedes que pertenecen a ese estado
        $sedesDelEstado = array_filter(
            Sede::cases(),
            fn($sede) => $sede->region() === $estado
        );

        $sede = fake()->randomElement($sedesDelEstado) ?? Sede::PRINCIPAL;

        return [
            'estado' => $estado->value,
            'sede' => $sede->value,
            'piso' => fake()->randomElement(Piso::cases())->value,
        ];
    }
}
