<?php

namespace App\Enums;

enum Sede: string
{
    case PRINCIPAL = 'principal';
    case SUBESTACION_NORTE = 'subestacion_norte';
    case SUBESTACION_SUR = 'subestacion_sur';
    case ALMACEN = 'almacen';

    public function label(): string
    {
        return match($this){
            self::PRINCIPAL => 'Sede Principal',
            self::SUBESTACION_NORTE => 'Subestación Norte',
            self::SUBESTACION_SUR => 'Subestación Sur',
            self::ALMACEN => 'Almacén',
            default => $this->value,
        };
    }
}