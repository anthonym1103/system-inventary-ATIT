<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use App\Models\HistorialEquipo;
use App\Models\Infraestructura;
use App\Models\Rede;
use App\Models\Transmision;
use App\Models\Ubicacion;
use App\Models\UserAsignado;
use App\Enums\Area;
use App\Enums\TipoEquipo;
use App\Enums\CondicionEquipo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class EquipoController extends Controller
{
    
    public function index(Request $request)
    {
        

    }
  
    public function store(Request $request)
    {
        
    }

    
    public function show(Equipo $equipo)
    {
        
    }

   
    public function update(Request $request, Equipo $equipo)
    {
        
    }

   
    public function destroy(Equipo $equipo)
    {
        
    }

   
}