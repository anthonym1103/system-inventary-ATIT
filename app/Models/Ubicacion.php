<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;
use App\Models\Equipo;
use App\Enums\EstadoRegion;
use App\Enums\Sede;
use App\Enums\Piso;

class Ubicacion extends Model
{
    //
    use HasFactory;

    protected $appends = ['sede_label', 'piso_label', 'estado_label'];

    protected $fillable = [
        'estado',
        'piso',
        'sede',
    ];

    protected $casts = [
        'estado' => EstadoRegion::class,
        'sede' => 'string',
        'piso' => 'string',
    ];

    public function equipos(): HasMany
    {
        return $this->hasMany(Equipo::class);
    }

    protected function sedeLabel(): Attribute
    {
        return Attribute::make(
            get: fn () => Sede::tryFrom($this->sede)?->label() ?? $this->sede,
        );
    }

    protected function pisoLabel(): Attribute
    {
        return Attribute::make(
            get: fn () => Piso::tryFrom($this->piso)?->label() ?? $this->piso,
        );
    }

    protected function estadoLabel(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->estado?->label() ?? $this->estado,
        );
    }
}
