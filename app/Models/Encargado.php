<?php

namespace App\Models;

use App\Models\Telefono;
use App\Models\Infraestructura;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;


class Encargado extends Model
{
    //

    protected $fillable = [
        'nombre',
        'apellido',
    ];


    public function telefonos():HasMany
    {
        return $this->hasMany(Telefono::class);
    }

    public function infraestructura():HasMany
    {
        return $this->hasMany(Infraestructura::class);
    }
}
