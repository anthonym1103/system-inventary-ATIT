<?php

namespace App\Enums;

enum TipoEquipo: string
{
    // Equipos habituales del área de infraestructura
    case MICRO_ESCRITORIO = 'micro_escritorio';
    case PORTATIL = 'portatil';
    case SERVIDOR = 'servidor';
    case IMPRESORA_MULTI = 'impresora_multi';
    case IMPRESORA = 'impresora';
    case IMPRESORA_PLANOS = 'impresora_planos';
    case SCANNER = 'scanner';

    // Equipos habituales del área de redes
    case ROUTER = 'router';
    case SWITCHES = 'switch';
    case TELEFONO_ANALOGICO = 'telefono_analogico';
    case TELEFONO_DIGITAL = 'telefono_digital';

    // Equipos habituales del área de transmisión
    case RADIO_PORTATIL = 'radio_portatil';
    case RADIO_BASE = 'radio_base';
    case RADIO_MOVIL = 'radio_movil';
    case MULTIPLEXOR = 'multiplexor_acceso';
    case TRANSPORTE_MO = 'transporte_m/o';
    case TRANSPORTE_FO = 'transporte_f/o';
    case REPETIDOR_VHF = 'repetidor_vhf';
    case ESTACION_MOVIL = 'estacion_movil_mts';
    case SERVIDOR_MTS = 'servidor_mts';

    public function label(): string
    {
        return match ($this) {
            self::MICRO_ESCRITORIO => 'Computador de escritorio',
            self::PORTATIL => 'Computador portatil',
            self::SERVIDOR => 'Servidor',
            self::IMPRESORA_MULTI => 'Impresora Multifuncional',
            self::IMPRESORA => 'Impresora',
            self::IMPRESORA_PLANOS => 'Impresora de Planos Plotter',
            self::SCANNER => 'Scanner',
            self::ROUTER => 'Router',
            self::SWITCHES => 'Switch',
            self::TELEFONO_ANALOGICO => 'Telefono Analogico',
            self::TELEFONO_DIGITAL => 'Telefono Digital',
            self::RADIO_PORTATIL => 'Radio Portatil ',
            self::RADIO_BASE => 'Radio Base',
            self::RADIO_MOVIL => 'Radio Movil',
            self::MULTIPLEXOR => 'Multiplexor Acceso',
            self::TRANSPORTE_MO => 'Transporte M/O',
            self::TRANSPORTE_FO => 'Transporte F/O',
            self::REPETIDOR_VHF => 'Repetidor VHF',
            self::ESTACION_MOVIL => 'Estacion Movil MTS',
            self::SERVIDOR_MTS => 'Servidor MTS',
            default => $this->value,
        };
    }
    
    public function area(): Area
    {
        return match ($this) {
            self::MICRO_ESCRITORIO,
            self::PORTATIL,
            self::SERVIDOR,
            self::IMPRESORA_MULTI,
            self::IMPRESORA,
            self::IMPRESORA_PLANOS,
            self::SCANNER => Area::INFRAESTRUCTURA,

            self::ROUTER,
            self::SWITCHES,
            self::TELEFONO_ANALOGICO,
            self::TELEFONO_DIGITAL => Area::REDES,

            self::RADIO_PORTATIL,
            self::RADIO_BASE,
            self::RADIO_MOVIL,
            self::MULTIPLEXOR,
            self::TRANSPORTE_MO,
            self::TRANSPORTE_FO,
            self::REPETIDOR_VHF,
            self::ESTACION_MOVIL,
            self::SERVIDOR_MTS => Area::TRANSMISION,
        };
    }
}