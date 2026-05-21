<?php

namespace App\Models;

use App\Models\Equipo;
use App\Models\Encargado;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Infraestructura extends Model
{
    //
    protected $incrementing = false;
    public $with = ['equipo'];

    protected $fillable = [
        'encargado_id',
        'año',
        'ram',
        'disco',
        'direccion_mac',
        'numero_inventario',
        'dominio',
        'estado',
        'unidad',
    ];

    public function equipos(): BelongsTo
    {
        return $this->belongsTo(Equipo::class);
    }

    public function encargados(): BelongsTo
    {
        return $this->belongsTo(Encargado::class);
    }
}
