<?php

namespace App\Models;

use App\Models\Equipo;
use App\Models\UserAsignado;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Infraestructura extends Model
{
    //
    protected $incrementing = false;
    public $with = ['equipo'];

    protected $fillable = [
        'asignado',
        'año',
        'ram',
        'disco',
        'direccion_mac',
        'sistema_operativo',
        'numero_inventario',
        'dominio',
        'unidad',
    ];

    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Equipo::class, 'id');
    }

    public function userAsignado(): BelongsTo
    {
        return $this->belongsTo(UserAsignado::class, 'asignado');
    }
}
