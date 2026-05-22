<?php

namespace App\Enums;

enum TipoEquipo: string
{
    //Equipos del area de infraestructura
    /*case MICRO_ESCRITORIO = 'micro_escritorio';
    case PORTATIL = 'portatil';
    case SERVIDOR = 'servidor';
    case IMPRESORA_MULTI = 'impresora_multi';
    case IMPRESORA = 'impresora';
    case IMPRESORA_PLANOS = 'impresora_planos';
    case ESCANER = 'Escaner';*/

    //Equipos del area de redes
    case ROUTER = 'Router';
    case SWITCHES = 'Switches';
    case ROUTER_WIFI = 'Router Wifi';

    //Equipos del area de transmision
    case RADIO_PORTATIL = 'Radio Portatil';
    case RADIO_BASE = 'Radio Base';
    case RADIO_MOVIL = 'Radio Movil';
    case MULTIPLEXOR = 'Multiplexor acceso';
    case TRANSPORTE_MO = 'Transporte M/O';
    case TRANSPORTE_FO = 'Transporte F/O';

    public function modulo(): Sector
    {
        return match($this){
            self::ROUTER, self::SWITCHES, self::ROUTER_WIFI => Sector::REDES,
            self::RADIO_PORTATIL, self::RADIO_BASE, self::RADIO_MOVIL, self::MULTIPLEXOR, self::TRANSPORTE_MO, self::TRANSPORTE_FO => Sector::TRANSMISION,
        };
    }



}
