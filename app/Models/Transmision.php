<?php

namespace App\Models;

use App\Models\Equipo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class Transmision extends Model
{
    /** @use HasFactory<\Database\Factories\TransmisionFactory> */
    use HasFactory;

    public $incrementing = false;
    public $with = ['equipo'];

    protected $fillable = [
        'potencia',
        'rango_frecuencia',
        'unidad_usuario',
        'caracteristicas',
        'numero_inventario',
    ];

    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Equipo::class, 'id');
    }
}
