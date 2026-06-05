<?php

namespace App\Models;

use App\Models\Equipo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Rede extends Model
{
    /** @use HasFactory<\Database\Factories\RedeFactory> */
    use HasFactory;

    public $incrementing = false;
    public $with = ['equipo'];

    protected $fillable = [
        'puerto',
        'puerto_fibra',
        'contraseña_bios',
        'direccion_ip',
        'direccion_mac',
        'extension',
        'ubicacion_puerto'
    ];

    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Equipo::class, 'id');
    }
}
