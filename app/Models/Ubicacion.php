<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Equipo;
use App\Enums\EstadoRegion;
use App\Enums\Sede;

class Ubicacion extends Model
{
    //
    use HasFactory;
    

    protected $fillable = [
        'estado',
        'piso',
        'sede',
    ];

    protected $casts = [
        'estado' => EstadoRegion::class,
        'sede' => Sede::class,
    ];

    public function equipos(): HasMany
    {
        return $this->hasMany(Equipo::class);
    }    
}
