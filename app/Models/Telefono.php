<?php

namespace App\Models;

use App\Models\Encargado;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Telefono extends Model
{
    //

    protected $fillable=[
        'encargado_id',
        'numero',
    ];

    public function encargados(): BelongsTo
    {
        return $this->belongsTo(Encargado::class);
    }
}
