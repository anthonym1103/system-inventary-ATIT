<?php

namespace App\Enums;

enum Piso: string
{
    case PISO_1 = 'piso_1';
    case PISO_2 = 'piso_2';
    case PISO_3 = 'piso_3';
    case PISO_4 = 'piso_4';
    case PISO_5 = 'piso_5';
    case PISO_6 = 'piso_6';


    public function label(): string
    {
        return match($this){
            self::PLANTA_BAJA => 'Planta Baja',
            self::PISO_1 => 'Piso 1',
            self::PISO_2 => 'Piso 2',
            self::PISO_3 => 'Piso 3',
            self::PISO_1 => 'Piso 4',
            self::PISO_2 => 'Piso 5',
            self::PISO_3 => 'Piso 6',
            default => $this->value,
        };
    }
}