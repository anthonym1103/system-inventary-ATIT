<?php

namespace App\Models;

use App\Models\Ubicacion;
use App\Models\HistorialEquipo;
use App\Models\Notificacion;
use App\Enums\TipoEquipo;
use App\Enums\Area;
use App\Enums\CondicionEquipo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Equipo extends Model
{
    /** @use HasFactory<\Database\Factories\EquipoFactory> */
    use HasFactory;


    protected $appends = ['tipo_label'];

    protected $fillable = [
        'ubicacion_id',
        'asignado_id',
        'area',
        'tipo',
        'condicion',
        'marca',
        'modelo',
        'serial',
        'numero_inventario',
        'caracteristicas',
        'detalle',
    ];

    protected $casts = [
        'area' => Area::class,
        'condicion' => CondicionEquipo::class,
    ];

    protected function tipoLabel(): Attribute
    {
        return Attribute::make(
            get: fn () => TipoEquipo::tryFrom($this->tipo)?->label() ?? $this->tipo,
        );
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

    public function mantenimientos(): HasMany
    {
        return $this->hasMany(Notificacion::class);
    }
}