<?php

namespace App\Enums;

enum Cargo: string
{
    case ADMINISTRADOR = 'administrador';
    case SUPERVISOR = 'supervisor';
    case TECNICO = 'tecnico'; 
}
