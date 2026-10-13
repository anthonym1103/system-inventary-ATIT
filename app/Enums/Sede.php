<?php

namespace App\Enums;

enum Sede: string
{
    case EDIFICIO_SEDE_PUERTO_AYACUCHO= 'edificio_sede_puerto_ayacucho';
    case TORRE_CORPORATIVA = 'torre_corporativa';
    case CARUACHI = 'caruachi';
    case EDIFICIO_SEDE_ALTA_VISTA = 'alta_vista_edificio_sede';
    case GURI = 'guri';
    case PLANTA_MACAGUA = 'planta_macagua';
    case EDIFICIO_PASEO_ORINOCO = 'edificio_paseo_orinoco';
    case PLANTA_SIDOR = 'planta_sidor';
    case GUAYANA_A = 'guayana_a';
    case GUAYANA_B = 'guayana_b';
    case OFICINA_COMERCIAL_SAN_FELIX = 'oficina_comercial_san_felix';
    case EDIFICIO_SEDE_LA_PLANTA = 'edificio_sede_la_planta';
    case CIUDAD_BOLIVAR = 'ciudad_bolivar';

    public function region(): EstadoRegion
    {
        return match($this){
            self::TORRE_CORPORATIVA, self::CARUACHI, self::EDIFICIO_SEDE_ALTA_VISTA, self::GURI, self::PLANTA_MACAGUA, self::EDIFICIO_PASEO_ORINOCO, self::PLANTA_SIDOR, self::GUAYANA_A, self::GUAYANA_B, self::OFICINA_COMERCIAL_SAN_FELIX, self::CIUDAD_BOLIVAR => EstadoRegion::BOLIVAR,
            self::EDIFICIO_SEDE_PUERTO_AYACUCHO => EstadoRegion::AMAZONAS,
            self::EDIFICIO_SEDE_LA_PLANTA => EstadoRegion::DELTA_AMACURO,
        };
    }

    public function label(): string
    {
        return match($this){
            self::EDIFICIO_SEDE_PUERTO_AYACUCHO => 'Edificio Sede Puerto Ayacucho',
            self::TORRE_CORPORATIVA => 'Torre Corporativa',
            self::CARUACHI => 'Caruachi',
            self::EDIFICIO_SEDE_ALTA_VISTA => 'Edificio Sede Alta Vista',
            self::GURI => 'Guri',
            self::PLANTA_MACAGUA => 'Planta Macagua',
            self::EDIFICIO_PASEO_ORINOCO => 'Edificio Paseo Orinoco',
            self::PLANTA_SIDOR => 'Planta Sidor',
            self::GUAYANA_A => 'Guayana A',
            self::GUAYANA_B => 'Guayana B',
            self::OFICINA_COMERCIAL_SAN_FELIX => 'Oficina Comercial San Felix',
            self::EDIFICIO_SEDE_LA_PLANTA => 'Edificio Sede La Planta',
            self::CIUDAD_BOLIVAR => 'Ciudad Bolivar',
            default => $this->value,
        };
    }
}