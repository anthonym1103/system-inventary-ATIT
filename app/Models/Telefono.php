<?php

namespace App\Models;

use App\Models\UserAsignado;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Telefono extends Model
{
    //

    protected $fillable=[
        'asignado',
        'numero',
    ];

    public function userAsignados(): BelongsTo
    {
        return $this->belongsTo(UserAsignado::class);
    }
}
