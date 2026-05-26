<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\HistorialEquipo;
use App\Enums\Area;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name','area', 'email', 'avatar', 'password'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;
    use HasRoles;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */

    
    protected function casts(): array
    {
        return [
            'area' => Area::class,
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }
    
    protected function avatar(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                // Si el campo tiene datos, genera la URL pública de Laravel
                if ($value) {
                    return asset('storage/' . $value);
                }
            
                // Opcional: Si no tiene avatar, puedes retornar una imagen por defecto 
                // o dejar que el Frontend use el <AvatarFallback> con sus iniciales devolviendo null
                return null; 
            }
        );
    }

    public function historialEquipos(): HasMany
    {
        return $this->hasMany(HistorialEquipo::class, 'usuario_id');
    }
    
} 
