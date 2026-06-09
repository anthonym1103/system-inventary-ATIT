<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Equipo;
use App\Enums\EstadoRegion;

class Ubicacion extends Model
{
    //
    use HasFactory;
    

    protected $fillable = [
        'estado',
        'locacion',
    ];

    protected $casts = [
        'estado' => EstadoRegion::class,
    ];

    public function equipos(): HasMany
    {
        return $this->hasMany(Equipo::class);
    }    
}
