<?php

namespace App\Models;

use App\Models\Telefono;
use App\Models\Infraestructura;
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
        'gerencia',
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
