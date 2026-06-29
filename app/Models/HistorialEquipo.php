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

    /*protected $cast = [
        'fecha_ajuste' => 'dateTime',
    ];*/

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Equipo::class);
    }
}
