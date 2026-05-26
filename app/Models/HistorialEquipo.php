<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Equipo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class HistorialEquipo extends Model
{
    //

    protected $fillable = [
        'usuario_id',
        'equipo_id',
        'detalle',
        'fecha_ajuste',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Equipo::class);
    }
}
