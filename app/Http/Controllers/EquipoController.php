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
    /**
     * Listado de equipos (con búsqueda, filtros y paginación).
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Equipo::query();
        
        // 1. Filtrar por área según los permisos del usuario
        $allowedAreas = $this->getUserAllowedAreas($user);
        if (!empty($allowedAreas) && !$user->hasRole('Administrador')) {
            $query->whereIn('area', $allowedAreas);
        }

        // 2. Búsqueda libre (marca, modelo, serial, tipo)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('marca', 'like', "%{$search}%")
                  ->orWhere('modelo', 'like', "%{$search}%")
                  ->orWhere('serial', 'like', "%{$search}%")
                  ->orWhere('tipo', 'like', "%{$search}%");
            });
        }

        // 3. Filtro por condición
        if ($request->filled('condicion')) {
            $query->where('condicion', $request->condicion);
        }

        // 4. Filtro por ubicación
        if ($request->filled('ubicacion_id')) {
            $query->where('ubicacion_id', $request->ubicacion_id);
        }

        // 5. Cargar relaciones necesarias para la tabla (solo las comunes o las que apliquen)
        // Por simplicidad, cargamos las relaciones polimórficas? No, son hasOne separados.
        // En la tabla se pueden mostrar datos de la relación según el área.
        $query->with(['ubicacion', 'infraestructura', 'rede', 'transmision', 'userAsignado']);

        $equipos = $query->paginate(15)->withQueryString();

        $tiposLabels = [];
        foreach (TipoEquipo::cases() as $tipo) {
            $tiposLabels[$tipo->value] = $tipo->label();
        }


        return Inertia::render('equipos/Index', [
            'equipos' => $equipos,
            'filters' => $request->only(['search', 'condicion', 'ubicacion_id']),
            'canCreate' => $user->hasAnyPermission(['area_infraestructura', 'area_redes', 'area_transmision']),
            'ubicaciones' => Ubicacion::all(['id', 'estado', 'locacion']),
            'tiposLabels' => $tiposLabels,
        ]);
    }

    /**
     * Muestra el formulario de creación.
     */
    public function create()
    {
        $user = Auth::user();
        $allowedAreas = $this->getUserAllowedAreas($user);

        if (empty($allowedAreas)) {
            return redirect()->route('equipos.index')
                ->with('error', 'No tienes permiso para crear equipos.');
        }

        $tiposDisponibles = [];
        foreach (TipoEquipo::cases() as $tipo) {
            if (in_array($tipo->modulo()->value, $allowedAreas)) {
                $tiposDisponibles[] = [
                    'value' => $tipo->value,
                    'label' => $tipo->label(),
                    'area' => $tipo->modulo()->value,
                ];
            }
        }

        return Inertia::render('equipos/Create', [
            'ubicaciones' => Ubicacion::all(['id', 'estado', 'locacion']),
            'areas' => array_map(fn($area) => ['value' => $area, 'label' => $area], $allowedAreas),
            'tipos' => $tiposDisponibles,
            'condiciones' => [
                ['value' => 'Operativo', 'label' => 'Operativo'],
                ['value' => 'No operativo', 'label' => 'No operativo'],
            ],
            // Para los selects de asignados (solo aplica a infraestructura o teléfonos)
            'asignados' => UserAsignado::all(['cedula', 'nombre', 'apellido']),
        ]);
    }

    /**
     * Almacena un nuevo equipo y sus datos específicos según área.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $allowedAreas = $this->getUserAllowedAreas($user);

        // Validar área y tipo
        $request->validate([
            'area' => ['required', 'string', Rule::in($allowedAreas)],
            'tipo' => ['required', 'string', function ($attribute, $value, $fail) use ($request) {
                $tipoEnum = TipoEquipo::tryFrom($value);
                if (!$tipoEnum || $tipoEnum->modulo()->value !== $request->area) {
                    $fail('El tipo seleccionado no pertenece al área indicada.');
                }
            }],
        ]);

        // Reglas base del equipo
        $rules = [
            'ubicacion_id' => 'required|exists:ubicacions,id',
            'condicion' => 'required|string|in:Operativo,No operativo',
            'marca' => 'nullable|string|max:255',
            'modelo' => 'required|string|max:255',
            'serial' => 'required|string|unique:equipos,serial',
            'detalle' => 'nullable|string',
        ];

        // Reglas específicas por área (condicionales según tipo)
        $area = $request->area;
        $tipo = $request->tipo;

        if ($area === Area::INFRAESTRUCTURA->value) {
            $rules = array_merge($rules, [
                'asignado' => 'nullable|exists:user_asignados,cedula',
                'año' => 'nullable|string',
                'ram' => 'nullable|string',
                'disco' => 'nullable|string',
                'direccion_mac' => 'nullable|string',
                'sistema_operativo' => 'nullable|string',
                'numero_inventario' => 'nullable|string',
                'dominio' => 'nullable|string',
            ]);
        } elseif ($area === Area::REDES->value) {
            // Definir reglas según tipo de equipo de redes
            $rules = array_merge($rules, $this->getRedesValidationRules($tipo));
        } elseif ($area === Area::TRANSMISION->value) {
            $rules = array_merge($rules, $this->getTransmisionValidationRules($tipo));
        }

        $validated = $request->validate($rules);

        // Crear equipo
        $equipo = Equipo::create([
            'ubicacion_id' => $request->ubicacion_id,
            'asignado_id' => $request->asignado ?? null, // solo para infraestructura o teléfonos
            'area' => $request->area,
            'tipo' => $request->tipo,
            'condicion' => $request->condicion,
            'marca' => $request->marca,
            'modelo' => $request->modelo,
            'serial' => $request->serial,
            'detalle' => $request->detalle,
        ]);

        // Crear registro específico del área
        if ($area === Area::INFRAESTRUCTURA->value) {
            Infraestructura::create([
                'id' => $equipo->id,
                'asignado' => $request->asignado,
                'anio' => $request->año,
                'ram' => $request->ram,
                'disco' => $request->disco,
                'direccion_mac' => $request->direccion_mac,
                'sistema_operativo' => $request->sistema_operativo,
                'numero_inventario' => $request->numero_inventario,
                'dominio' => $request->dominio,
            ]);
        } elseif ($area === Area::REDES->value) {
            Rede::create(array_merge(
                ['id' => $equipo->id],
                $this->filterRedesData($request, $tipo)
            ));
        } elseif ($area === Area::TRANSMISION->value) {
            Transmision::create(array_merge(
                ['id' => $equipo->id],
                $this->filterTransmisionData($request, $tipo)
            ));
        }

        // Registrar historial
        HistorialEquipo::create([
            'usuario_id' => $user->id,
            'equipo_id' => $equipo->id,
            'detalle' => 'Equipo creado',
            'fecha_ajuste' => now(),
        ]);

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo creado exitosamente.');
    }

    /**
     * Muestra un equipo específico con todas sus relaciones.
     */
    public function show(Equipo $equipo)
    {
        $user = Auth::user();
        $this->authorizeArea($user, $equipo->area);

        // Cargar la relación correspondiente según el área
        if ($equipo->area === Area::INFRAESTRUCTURA->value) {
            $equipo->load('infraestructura.userAsignado');
        } elseif ($equipo->area === Area::REDES->value) {
            $equipo->load('rede');
        } elseif ($equipo->area === Area::TRANSMISION->value) {
            $equipo->load('transmision');
        }

        $equipo->load('ubicacion', 'historialEquipos.usuario');

        return Inertia::render('equipos/Show', [
            'equipo' => $equipo,
        ]);
    }

    /**
     * Muestra el formulario de edición.
     */
    public function edit(Equipo $equipo)
    {
        $user = Auth::user();
        $this->authorizeArea($user, $equipo->area);

        // Cargar la relación correspondiente según el área
        if ($equipo->area === Area::INFRAESTRUCTURA->value) {
            $equipo->load('infraestructura');
        } elseif ($equipo->area === Area::REDES->value) {
            $equipo->load('rede');
        } elseif ($equipo->area === Area::TRANSMISION->value) {
            $equipo->load('transmision');
        }

        // Tipos permitidos para esta área (solo los de su área)
        $tiposDisponibles = [];
        foreach (TipoEquipo::cases() as $tipo) {
            if ($tipo->modulo()->value === $equipo->area) {
                $tiposDisponibles[] = [
                    'value' => $tipo->value,
                    'label' => $tipo->label(),
                ];
            }
        }

        // Datos adicionales para el formulario según área
        $extraData = [];
        if ($equipo->area === Area::INFRAESTRUCTURA->value) {
            $extraData['asignados'] = UserAsignado::all(['cedula', 'nombre', 'apellido']);
        } elseif ($equipo->area === Area::REDES->value) {
            // Posiblemente no se necesite nada extra
        }

        return Inertia::render('equipos/Edit', array_merge([
            'equipo' => $equipo,
            'ubicaciones' => Ubicacion::all(['id', 'estado', 'locacion']),
            'tipos' => $tiposDisponibles,
            'condiciones' => [
                ['value' => 'Operativo', 'label' => 'Operativo'],
                ['value' => 'No operativo', 'label' => 'No operativo'],
            ],
        ], $extraData));
    }

    /**
     * Actualiza el equipo y sus datos específicos.
     */
    public function update(Request $request, Equipo $equipo)
    {
        $user = Auth::user();
        $this->authorizeArea($user, $equipo->area);

        // Reglas base
        $rules = [
            'ubicacion_id' => 'sometimes|exists:ubicacions,id',
            'condicion' => 'sometimes|string|in:Operativo,No operativo',
            'marca' => 'nullable|string|max:255',
            'modelo' => 'sometimes|string|max:255',
            'serial' => ['sometimes', 'string', Rule::unique('equipos', 'serial')->ignore($equipo->id)],
            'detalle' => 'nullable|string',
        ];

        $area = $equipo->area;
        $tipo = $equipo->tipo; // El tipo no debería cambiar, pero si se permite, habría que validar

        if ($area === Area::INFRAESTRUCTURA->value) {
            $rules = array_merge($rules, [
                'asignado' => 'nullable|exists:user_asignados,cedula',
                'año' => 'nullable|string',
                'ram' => 'nullable|string',
                'disco' => 'nullable|string',
                'direccion_mac' => 'nullable|string',
                'sistema_operativo' => 'nullable|string',
                'numero_inventario' => 'nullable|string',
                'dominio' => 'nullable|string',
            ]);
        } elseif ($area === Area::REDES->value) {
            $rules = array_merge($rules, $this->getRedesValidationRules($tipo, false));
        } elseif ($area === Area::TRANSMISION->value) {
            $rules = array_merge($rules, $this->getTransmisionValidationRules($tipo, false));
        }

        $request->validate($rules);

        // Actualizar campos del equipo
        $equipo->update($request->only([
            'ubicacion_id', 'condicion', 'marca', 'modelo', 'serial', 'detalle'
        ]));

        // Manejar actualización del registro específico
        if ($area === Area::INFRAESTRUCTURA->value) {
            $infra = $equipo->infraestructura ?: new Infraestructura(['id' => $equipo->id]);
            $infra->fill($request->only([
                'asignado', 'anio', 'ram', 'disco', 'direccion_mac', 'sistema_operativo',
                'numero_inventario', 'dominio',
            ]));
            $infra->save();
        } elseif ($area === Area::REDES->value) {
            $rede = $equipo->rede ?: new Rede(['id' => $equipo->id]);
            $redeData = $this->filterRedesData($request, $tipo);
            $rede->fill($redeData);
            $rede->save();
        } elseif ($area === Area::TRANSMISION->value) {
            $trans = $equipo->transmision ?: new Transmision(['id' => $equipo->id]);
            $transData = $this->filterTransmisionData($request, $tipo);
            $trans->fill($transData);
            $trans->save();
        }

        // El historial de cambios se registra automáticamente mediante el evento `updating` del modelo.

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo actualizado correctamente.');
    }

    /**
     * Elimina el equipo (y sus relaciones por cascade).
     */
    public function destroy(Equipo $equipo)
    {
        $user = Auth::user();
        $this->authorizeArea($user, $equipo->area);

        HistorialEquipo::create([
            'usuario_id' => $user->id,
            'equipo_id' => $equipo->id,
            'detalle' => 'Equipo eliminado',
            'fecha_ajuste' => now(),
        ]);

        $equipo->delete();

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo eliminado.');
    }

    // ------------------------------------------------------------------------
    // Métodos privados auxiliares
    // ------------------------------------------------------------------------

    /**
     * Devuelve las reglas de validación para equipos de redes según el tipo.
     */
    private function getRedesValidationRules(string $tipo, bool $required = true): array
    {
        $rules = [
            'puerto' => 'nullable|string',
            'puerto_fibra' => 'nullable|string',
            'contraseña_bios' => 'nullable|string',
            'direccion_ip' => 'nullable|ip',
            'direccion_mac' => 'nullable|regex:/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/',
            'extension' => 'nullable|string',
            'ubicacion_puerto' => 'nullable|string',
        ];

        // Según el tipo, algunos campos pueden ser requeridos o no.
        // Ejemplo: teléfono analógico no tiene IP ni MAC, pero puede tener extensión.
        // Aquí definimos qué campos son requeridos (si required=true) o simplemente permitimos nulos.
        // Para mantener flexibilidad, no hacemos campos requeridos a menos que sea estrictamente necesario.
        // El frontend se encargará de mostrar/ocultar, y el backend permite nulos.
        // Si quisiéramos exigir ciertos campos según tipo, podríamos hacer:
        if ($tipo === 'telefono_analogico') {
            // Por ejemplo, extensión podría ser requerida
            if ($required) {
                $rules['extension'] = 'required|string';
            }
            // Eliminar reglas que no aplican
            $rules['direccion_ip'] = 'prohibited';
            $rules['direccion_mac'] = 'prohibited';
        } elseif ($tipo === 'telefono_digital') {
            if ($required) {
                $rules['direccion_ip'] = 'required|ip';
                $rules['extension'] = 'required|string';
            }
            $rules['puerto_fibra'] = 'prohibited';
            $rules['ubicacion_puerto'] = 'prohibited';
        } else {
            // routers, switches, router_wifi
            if ($required) {
                $rules['direccion_ip'] = 'required|ip';
                $rules['direccion_mac'] = 'required|regex:/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/';
            }
            $rules['extension'] = 'prohibited';
            $rules['ubicacion_puerto'] = 'prohibited';
        }

        return $rules;
    }

    /**
     * Filtra los datos recibidos para el modelo Rede según el tipo.
     * Solo toma los campos que aplican, evitando guardar valores null en columnas que no deben tenerlos.
     */
    private function filterRedesData(Request $request, string $tipo): array
    {
        $data = [];
        $allowedFields = ['puerto', 'puerto_fibra', 'contraseña_bios', 'direccion_ip', 'direccion_mac', 'extension', 'ubicacion_puerto'];

        foreach ($allowedFields as $field) {
            if ($request->has($field)) {
                $data[$field] = $request->input($field);
            }
        }

        // Limpiar según tipo (opcional: eliminar campos que no deben persistir)
        if ($tipo === 'telefono_analogico') {
            unset($data['direccion_ip'], $data['direccion_mac']);
        } elseif ($tipo === 'telefono_digital') {
            unset($data['puerto_fibra'], $data['ubicacion_puerto']);
        } else {
            unset($data['extension'], $data['ubicacion_puerto']);
        }

        return $data;
    }

    /**
     * Devuelve las reglas de validación para equipos de transmisión según el tipo.
     */
    private function getTransmisionValidationRules(string $tipo, bool $required = true): array
    {
        $rules = [
            'potencia' => 'nullable|string',
            'rango_frecuencia' => 'nullable|string',
            'unidad_usuario' => 'nullable|string',
            'caracteristicas' => 'nullable|string',
            'numero_inventario' => 'nullable|string',
        ];

        // Ejemplo: radios pueden necesitar potencia y rango; multiplexores quizás no.
        if (in_array($tipo, ['radio_portatil', 'radio_base', 'radio_movil', 'repetidor_vhf', 'estacion_movil_mts'])) {
            if ($required) {
                $rules['potencia'] = 'required|string';
                $rules['rango_frecuencia'] = 'required|string';
            }
            $rules['numero_inventario'] = 'nullable';
        } elseif (in_array($tipo, ['multiplexor', 'transporte_m/o', 'transporte_f/o', 'servidor_mts'])) {
            if ($required) {
                $rules['numero_inventario'] = 'required|string';
            }
            $rules['potencia'] = 'prohibited';
            $rules['rango_frecuencia'] = 'prohibited';
            $rules['unidad_usuario'] = 'prohibited';
            $rules['caracteristicas'] = 'prohibited';
        }

        return $rules;
    }

    /**
     * Filtra los datos para Transmision según tipo.
     */
    private function filterTransmisionData(Request $request, string $tipo): array
    {
        $data = $request->only(['potencia', 'rango_frecuencia', 'unidad_usuario', 'caracteristicas', 'numero_inventario']);

        if (in_array($tipo, ['radio_portatil', 'radio_base', 'radio_movil', 'repetidor_vhf', 'estacion_movil_mts'])) {
            unset($data['numero_inventario']); // Opcional, lo dejamos pero podría ser null en BD
        } elseif (in_array($tipo, ['multiplexor', 'transporte_m/o', 'transporte_f/o', 'servidor_mts'])) {
            unset($data['potencia'], $data['rango_frecuencia'], $data['unidad_usuario'], $data['caracteristicas']);
        }

        return $data;
    }

    /**
     * Devuelve las áreas a las que el usuario tiene permiso.
     */
    private function getUserAllowedAreas($user): array
    {
        $areas = [];
        if ($user->area->value === Area::INFRAESTRUCTURA->value) {
            $areas[] = Area::INFRAESTRUCTURA->value;
        }
        if ($user->area->value === Area::REDES->value) {
            $areas[] = Area::REDES->value;
        }
        if ($user->area->value === Area::TRANSMISION->value) {
            $areas[] = Area::TRANSMISION->value;
        }
        if ($user->hasRole('Administrador')) {
            return array_map(fn($area) => $area->value, Area::cases());
        }
        return $areas;
    }

    /**
     * Autoriza el acceso al área del equipo.
     */
    private function authorizeArea($user, string $area)
    {
        $permiso = 'area_' . $area; // El área ya viene en minúsculas sin espacios
        if (!$user->hasPermissionTo($permiso) && !$user->hasRole('Administrador')) {
            abort(403, 'No tienes permiso para acceder a este equipo.');
        }
    }
}