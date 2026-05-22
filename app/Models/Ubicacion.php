<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Equipo;

class Ubicacion extends Model
{
    //
    use HasFactory;
    

    protected $fillable = [
        'estado',
        'locacion',
    ];

    public function equipos(): HasMany
    {
        return $this->hasMany(Equipo::class);
    }    
}
