<?php

namespace App\Models;

use App\Models\Ubicacion;
use App\Models\HistorialEquipo;
use App\Models\Infraestructura;
use App\Models\Mantenimiento;
use App\Models\Rede;
use App\Models\Transmision;
use App\Enums\Area;
use App\Enums\CondicionEquipo;
use App\Enums\TipoEquipo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Equipo extends Model
{
    /** @use HasFactory<\Database\Factories\EquipoFactory> */
    use HasFactory;

    protected $fillable = [
        'ubicacion_id',
        'asignado_id',
        'area',
        'tipo',
        'condicion',
        'marca',
        'modelo',
        'serial',
        'detalle',
    ];

    protected $casts = [
        'area' => Area::class,
        'tipo' => TipoEquipo::class,
        'condicion' => CondicionEquipo::class,
    ];


    protected static function booted()
    {
        static::deleting(function ($equipo) {
            $equipo->infraestructura()?->delete();
        });

        static::updating(function ($equipo) {
            $cambios = [];
            foreach ($equipo->getDirty() as $campo => $nuevoValor) {
                $original = $equipo->getOriginal($campo);
                if ($original != $nuevoValor) {
                    $cambios[] = "{$campo}: de '{$original}' a '{$nuevoValor}'";
                }
            }
            if (!empty($cambios)) {
                HistorialEquipo::create([
                'usuario_id' => auth()->id(),
                'equipo_id' => $equipo->id,
                'detalle' => 'Modificación: ' . implode(', ', $cambios),
                'fecha_ajuste' => now(),
                ]);
            }
        });
    }

    public function ubicacion(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class);
    }

    public function userAsignado(): BelongsTo
    {
        return $this->belongsTo(UserAsignado::class, 'asignado_id');
    }

    public function historialEquipos(): HasMany
    {
        return $this->hasMany(HistorialEquipo::class, 'equipo_id');
    }
    
    public function infraestructura(): HasOne
    {
        return $this->hasOne(Infraestructura::class, 'id');
    }
    
    public function rede(): HasOne
    {
        return $this->hasOne(Rede::class, 'id');
    }

    public function transmision(): HasOne
    {
        return $this->hasOne(Transmision::class, 'id');
    }

    public function mantenimientos(): HasMany
    {
        return $this->hasMany(Mantenimiento::class);
    }

    
}
