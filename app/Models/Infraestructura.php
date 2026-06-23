<?php

namespace App\Models;

use App\Models\Equipo;
use App\Models\UserAsignado;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Infraestructura extends Model
{
    //
    use HasFactory;

    public $incrementing = false;
    public $with = ['equipo'];

    protected $fillable = [
        'anio',
        'ram',
        'disco',
        'direccion_mac',
        'sistema_operativo',
        'numero_inventario',
        'dominio',
    ];

    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Equipo::class, 'id');
    }

}
