<?php

namespace Database\Factories;

use App\Models\Equipo;
use App\Models\Ubicacion;
use App\Models\UserAsignado;
use App\Models\Infraestructura;
use App\Models\Transmision;
use App\Models\Rede;
use App\Enums\Area;
use App\Enums\TipoEquipo;
use App\Enums\CondicionEquipo;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Equipo>
 */
class EquipoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    protected $model = Equipo::class;

    public function definition(): array
    {
        //Seleccionar un area aleatoria
        $area = fake()->randomElement(Area::cases())->value;
        
        //Obtener tipos posibles para su area
        $tipos = array_filter(TipoEquipo::cases(), fn($tipo) => $tipo->modulo()->value == $area);

        //Seleccionar un tipo aleatorio
        $tipo = fake()->randomElement($tipos)->value;

        return [
            'ubicacion_id' => Ubicacion::inRandomOrder()->first()?->id ?? Ubicacion::factory(),
            'asignado_id' => UserAsignado::inRandomOrder()->first()?->cedula ?? UserAsignado::factory(),
            'area' => $area,
            'tipo' => $tipo,
            'condicion' => fake()->randomElement(CondicionEquipo::cases())->value,
            'marca' => fake()->company(),
            'modelo' => fake()->bothify('Modelo-###'),
            'serial' => fake()->unique()->uuid(),
            'numero_inventario' => fake()->unique()->numerify('INV-####'),
            'detalle' => fake()->optional()->sentence(),
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function(Equipo $equipo){
            
            if($equipo->area->value === Area::INFRAESTRUCTURA->value){
                if($equipo->tipo->value === 'servidor'){
                    Infraestructura::factory()->create([
                        'id' => $equipo->id,
                        'anio' => null,
                        'sistema_operativo' => null,
                        'dominio' => null,
                    ]);
                }else if($equipo->tipo->value === 'micro_escritorio' || $equipo->tipo->value === 'portatil'){
                    Infraestructura::factory()->create(['id' => $equipo->id]);
                }else{
                    Infraestructura::factory()->create([
                        'id' => $equipo->id,
                        'anio' => null,
                        'sistema_operativo' => null,
                        'dominio' => null,
                        'ram' => null,
                        'disco' => null,
                        'direccion_mac' => null,
                    ]);
                }
            }else if($equipo->area->value === Area::REDES->value){
                if($equipo->tipo->value === 'telefono_analogico'){
                    Rede::factory()->create([
                    'id' => $equipo->id,
                    'puerto_fibra' => null,
                    'direccion_ip' => null,
                    'direccion_mac' => null,
                    ]);
                }else if($equipo->tipo->value === 'telefono_digital'){
                    Rede::factory()->create([
                        'id' => $equipo->id,
                        'puerto_fibra' => null,
                        'ubicacion_puerto' => null,
                        ]);
                }else{
                    Rede::factory()->create([
                        'id' => $equipo->id,
                        'puerto_fibra' => null,
                        'extension' => null,
                        'ubicacion_puerto' => null,
                        ]);
                }
            }else if($equipo->area->value === Area::TRANSMISION->value){
                if($equipo->tipo->value === 'radio_portatil' || $equipo->tipo->value === 'radio_base' || $equipo->tipo->value === 'radio_movil'){
                    Transmision::factory()->create([
                        'id' => $equipo->id,
                        ]);
                }else{
                    Transmision::factory()->create([
                        'id' => $equipo->id,
                        'potencia' => null,
                        'rango_frecuencia' => null,
                        'unidad_usuario' => null,
                        'caracteristicas' => null, 
                        ]);
                }
            }
        });
    }
}
