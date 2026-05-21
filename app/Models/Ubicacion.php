<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Equipo;
use App\Models\Localidad;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class Ubicacion extends Model
{
    /** @use HasFactory<\Database\Factories\UbicacionFactory> */
    use HasFactory;

    protected $fillable = [
        'localidad_id',
        'nombre',
    ];

    protected function equipos(): HasMany
    {
        return $this->hasMany(Equipo::class);
    }

    protected function localidades(): BelongsTo
    {
        return $this->belongsTo(Localidad::class);
    }
}
