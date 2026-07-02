<?php

namespace App\Enums;

enum CondicionEquipo: string
{
    case OPERATIVO = 'operativo';
    case NO_OPERATIVO = 'no_operativo';

    public function label(): string
    {
        return match($this){
            self::OPERATIVO => 'Operativo',
            self::NO_OPERATIVO => 'No operativo',
            default => $this->value,
        };
    }
}
