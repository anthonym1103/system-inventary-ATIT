<?php

namespace App\Enums;

enum Area: string
{
    case INFRAESTRUCTURA = 'infraestructura';
    case REDES = 'redes';
    case TRANSMISION = 'transmision_datos';

    public function label(): string
    {
        return match($this){
            self::INFRAESTRUCTURA => 'Infraestructura',
            self::REDES => 'Redes y telefonia',
            self::TRANSMISION => 'Transmision de datos',
            default => $this->value,
        };
    }
}
