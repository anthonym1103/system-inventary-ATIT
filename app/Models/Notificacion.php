<?php

namespace App\Models;

use App\Models\Equipo;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notificacion extends Model
{
    protected $fillable = [
        'equipo_id',
        'usuario_id',
        'fecha_mantenimiento',
        'detalle',
        'leido',
    ];

    protected $casts = [
        'fecha_mantenimiento' => 'date',
        'leido' => 'boolean',
    ];

    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Equipo::class);
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
