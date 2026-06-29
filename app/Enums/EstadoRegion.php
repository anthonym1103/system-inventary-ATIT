<?php

namespace App\Enums;

enum EstadoRegion: string
{
    case BOLIVAR = 'bolivar';
    case AMAZONAS = 'amazonas';
    case DELTA_AMACURO = 'delta_amacuro';



    public function label(): string
    {
        return match($this){
            self::BOLIVAR => 'Bolivar',
            self::AMAZONAS => 'Amazonas',
            self::DELTA_AMACURO => 'Delta Amacuro',
            default => $this->value,
        };
    }
}
