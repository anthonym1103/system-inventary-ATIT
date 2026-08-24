<?php

namespace Database\Factories;

use App\Models\Equipo;
use App\Models\Ubicacion;
use App\Models\UserAsignado;
use App\Enums\Area;
use App\Enums\TipoEquipo;
use App\Enums\CondicionEquipo;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Equipo>
 */
class EquipoFactory extends Factory
{
    protected $model = Equipo::class;

    public function definition(): array
    {
        
        $tipo = fake()->randomElement(TipoEquipo::cases());
        $area = $tipo->area()->value;

        return [
            'ubicacion_id' => Ubicacion::inRandomOrder()->first()?->id ?? Ubicacion::factory(),
            'asignado_id' => UserAsignado::inRandomOrder()->first()?->cedula ?? UserAsignado::factory(),
            'area' => $area,
            'tipo' => $tipo->value,
            'condicion' => fake()->randomElement(CondicionEquipo::cases())->value,
            'marca' => fake()->company(),
            'modelo' => fake()->bothify('Modelo-###'),
            'serial' => fake()->unique()->uuid(),
            'numero_inventario' => fake()->unique()->numerify('INV-####'),
            'detalle' => fake()->optional()->sentence(),
            'caracteristicas' => fake()->optional(0.85)->randomElement([
                "RAM: 8GB\nDisco: 512GB SSD\nSistema Operativo: Windows 11\nDirección MAC: " . fake()->macAddress(),
                "Puerto: 24\nDirección IP: " . fake()->localIpv4() . "\nDirección MAC: " . fake()->macAddress(),
                "Potencia: 5W\nRango de frecuencia: 400Mhz\nUnidad/Usuario: " . fake()->name(),
                fake()->paragraph(),
            ]),
        ];
    }
}