<?php

namespace App\Models;

use App\Models\Equipo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserAsignado extends Model
{

    use HasFactory;

    protected $primaryKey = 'cedula';
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'cedula',
        'nombre',
        'apellido',
        'telefono',
        'gerencia',
    ];

    public function equipo():HasMany
    {
        return $this->hasMany(Equipo::class);
    }
}
