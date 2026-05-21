<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Ubicacion;
use App\Models\HistorialEquipo;
use App\Models\Infraestructura;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Equipo extends Model
{
    /** @use HasFactory<\Database\Factories\EquipoFactory> */
    use HasFactory;

    protected $fillable = [
        'ubicacion_id',
        'sector',
        'tipo',
        'condicion',
        'marca',
        'modelo',
        'serial',
        'detalle',
    ];

    protected static function booted()
    {
        static::deleting(function ($equipo){
            $equipo->infraestructura()?->delete();
        });
    }

    public function ubicacion(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class);
    }

    public function historialEquipos(): HasMany
    {
        return $this->hasMany(HistorialEquipo::class);
    }
    
    public function infraestructura(): HasOne
    {
        return $this->hasOne(Infraestructura::class);
    }
}
