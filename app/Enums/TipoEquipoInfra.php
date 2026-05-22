<?php

namespace App\Enums;

enum TipoEquipoInfra: string
{
    case MICRO_ESCRITORIO = 'micro_escritorio';
    case PORTATIL = 'portatil';
    case SERVIDOR = 'servidor';
    case IMPRESORA_MULTI = 'impresora_multi';
    case IMPRESORA = 'impresora';
    case IMPRESORA_PLANOS = 'impresora_planos';
    case ESCANER = 'Escaner';


    public function label(): string
    {
        return match($this){
            self::MICRO_ESCRITORIO => 'Microcomputador de escritorio',
            self::PORTATIL => 'Portatil',
            self::SERVIDOR => 'Servidor',
            self::IMPRESORA_MULTI => 'Impresora Multifuncional',
            self::IMPRESORA => 'Impresora',
            self::IMPRESORA_PLANOS => 'Impresora de Planos Plotter',
            self::ESCANER => 'Escaner',
        };
    }
}
