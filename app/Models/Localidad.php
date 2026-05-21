<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Ubicacion;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Localidad extends Model
{
    /** @use HasFactory<\Database\Factories\LocalidadFactory> */
    use HasFactory;

    protected $fillable = [
        'nombre',
    ];

    protected function ubicaciones(): HasMany
    {
        return $this->hasMany(Ubicacion::class);
    }

    
}
