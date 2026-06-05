<?php

namespace Database\Factories;

use App\Models\Rede;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Rede>
 */
class RedeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */

    protected $model = Rede::class;
    protected static ?string $password;
    
    public function definition(): array
    {
        return [
            'puerto' => fake()->unique->numerify('####'),
            'puerto_fibra' => fake()->unique()->numerify('####'),
            'contraseña_bios'=> static::$password ??= Hash::make('password'),
            'direccion_ip' => fake()->localIpv4(),
            'direccion_mac' => fake()->macAddress(),
            'extension' => fake()->unique()->numerify('#####'),
            'ubicacion_puerto' => fake()->unique()->numerify('#-#-#-#'),
        ];
    }
}
