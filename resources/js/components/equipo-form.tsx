import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PasswordInput from '@/components/password-input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';

interface CampoConfig {
    label: string;
    holdertext?: string;
    type?: 'password';
    textarea?: boolean;
}

const CAMPO_CONFIG: Record<string, CampoConfig> = {
    anio: { label: 'Año', holdertext: 'Ingrese el año...' },
    ram: { label: 'RAM', holdertext: 'Ingrese la cantidad de ram...' },
    disco: { label: 'Disco', holdertext: 'Ingrese el tamaño del disco...' },
    direccion_mac: { label: 'Dirección MAC', holdertext: 'Ej. 00:1A:2B:3C:4D:5E'},
    sistema_operativo: { label: 'Sistema Operativo', holdertext: 'Ingrese el sistema operativo...' },
    numero_inventario: { label: 'Número de Inventario', holdertext: 'Ingrese el numero de inventario...' },
    dominio: { label: 'Dominio', holdertext: 'Ingrese el dominio...'},
    puerto: { label: 'Puerto', holdertext: 'Ingrese el puerto...' },
    contraseña_bios: { label: 'Contraseña BIOS', type: 'password'},
    direccion_ip: { label: 'Dirección IP', holdertext: 'Ej. 192.168.100.256' },
    extension: { label: 'Extensión', holdertext: 'Ingrese la extension...' },
    ubicacion_puerto: { label: 'Ubicación del Puerto', holdertext: 'Ej. 03-04-05-06' },
    potencia: { label: 'Potencia', holdertext: 'Ingrese la potencia...' },
    rango_frecuencia: { label: 'Rango de Frecuencia', holdertext: 'Ingrese la frecuenia...' },
    unidad_usuario: { label: 'Unidad / Usuario', holdertext: 'Ingrese unidad/usuario...' },
    caracteristicas: { label: 'Características', textarea: true, holdertext: 'Ingrese caracteristicas...' },
};



export interface TipoConfig {
    area: string;
    campos: string[];
    requiereEncargado: boolean;
}


export type EquipoFormData = {
    tipo: string;
    estados: string;
    locacions:string;
    condicion: string;
    asignado_cedula: string;
    asignado_nombre: string;
    asignado_apellido: string;
    asignado_telefono: string;
    asignado_gerencia: string;
    marca: string;
    modelo: string;
    serial: string;
    detalle: string;
    [campo: string]: string;
};

interface EquipoFormProps {
    mode: 'create' | 'edit';
    equipoId?: number;
    tiposLabels: Record<string, string>;
    camposPorTipo: Record<string, TipoConfig>;
    ubicaciones: Array<{ value: string, label: string }>;
    condiciones: Array<{ value: string; label: string }>;
    initialData?: Partial<EquipoFormData>;
    tieneContrasenaBios?: boolean;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function EquipoForm({mode, equipoId, tiposLabels, camposPorTipo, ubicaciones, condiciones, initialData, tieneContrasenaBios = false, onSuccess, onCancel }: EquipoFormProps) {
    const { data, setData, post, put, processing, errors, reset, isDirty } = useForm<EquipoFormData>({
        tipo: '',
        estados: '',
        locacions: '',
        condicion: 'operativo',
        asignado_cedula: '',
        asignado_nombre: '',
        asignado_apellido: '',
        asignado_telefono: '',
        asignado_gerencia: '',
        marca: '',
        modelo: '',
        serial: '',
        detalle: '',
        ...initialData,
    });

    const tipoConfig = data.tipo ? camposPorTipo[data.tipo] : undefined;
    const camposActivos = useMemo(() => tipoConfig?.campos ?? [], [tipoConfig]);
    const requiereEncargado = tipoConfig?.requiereEncargado ?? false;
    const cardForMode = mode === 'create' ? 'mx-[22%]' : '';

    const handleTipoChange = (nuevoTipo: string) => {
        const nuevosCampos = camposPorTipo[nuevoTipo]?.campos ?? [];
        const nuevoRequiereEncargado = camposPorTipo[nuevoTipo]?.requiereEncargado ?? false;
        const limpios: Record<string, string> = {};

        nuevosCampos.forEach((campo) => {
            // Si el campo ya estaba activo con el tipo anterior, conservamos
            // su valor; si es nuevo para este tipo, lo dejamos vacío.
            limpios[campo] = camposActivos.includes(campo) ? data[campo] ?? '' : '';
        });

        setData((prev) => ({
            ...prev,
            tipo: nuevoTipo,
            ...(! nuevoRequiereEncargado && {
                asignado_cedula: '',
                asignado_nombre: '',
                asignado_apellido: '',
                asignado_telefono: '',
                asignado_gerencia: '',
            }),
            ...limpios,
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (mode === 'create') {
            post('/equipos', { onSuccess: () => {
                reset();
                onSuccess?.();
                },
            });
        } else if (equipoId) {
            put(`/equipos/${equipoId}`, { onSuccess: () => {
                onSuccess?.();
                },
            });
        }
    };

    const formatInput = (type: string, value:string): string =>{
        var limited = '';
        var parts =  [];
        switch(type){
            case 'serial':
                const valueUpper = value.toUpperCase();
                limited = valueUpper.slice(0,255);
                return limited;
            case 'direccion_mac':
                const hexDigits = value.toUpperCase().replace(/[^0-9A-F]/g, '');
                limited = hexDigits.slice(0, 12);
                parts = limited.match(/.{1,2}/g) || [];
                return parts.join(':');
            case 'ubicacion_puerto':
                const digits = value.replace(/\D/g, '');
                limited = digits.slice(0, 8);
                parts = limited.match(/.{1,2}/g) || [];
                return parts.join('-');
            case 'direccion_ip':
                const ipDigits = value.replace(/\D/g, '');
                limited = ipDigits.slice(0, 12);
                parts = limited.match(/.{1,3}/g) || [];
                return parts.join('.');
            default:
                return value;
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card className = {cardForMode}>
                <CardHeader className="flex items-center gap-1">
                    <CardTitle className="text-base">Información General</CardTitle>
                    {mode === 'edit' && (
                        <div className="flex flex-row">
                            <span className="ml-2 text-sm text-muted-foreground">
                               • {tiposLabels[data.tipo] || data.tipo} •
                            </span>
                        </div>
                    )}                    
                </CardHeader>
                <CardContent className="space-y-4">
                    {mode === 'create' && (
                        <div className="grid gap-2">
                            <Label className="cursor-text select-text w-fit">Tipo de Equipo <span className="text-destructive cursor-text select-text w-fit">*</span></Label>
                            <Select value={data.tipo} onValueChange={handleTipoChange}>
                                <SelectTrigger className="w-full cursor-pointer">
                                    <SelectValue placeholder="Selecciona un tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(tiposLabels).map(([value, label]) => (
                                        <SelectItem key={value} value={value} className="cursor-pointer">
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.tipo} />
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label className="cursor-text select-text w-fit">Estado/Region {mode === 'create' && <span className="text-destructive cursor-text select-text w-fit">*</span>}</Label>
                        <Select
                            value={data.estados}
                            onValueChange={(val) => setData('estados', val)}
                        >
                            <SelectTrigger className="w-full cursor-pointer">
                                <SelectValue placeholder="Selecciona una ubicación" />
                            </SelectTrigger>
                            <SelectContent>
                                {ubicaciones.map((u) => (
                                    <SelectItem key={u.value} value={u.value} className="cursor-pointer">
                                        {u.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.estados} />
                    </div>

                    <div className="grid gap-2">
                        <Label className="cursor-text select-text w-fit">Locacion del equipo {mode === 'create' && <span className="text-destructive cursor-text select-text w-fit">*</span>}</Label>
                        <textarea
                            className="border-input flex min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                            value={data.locacions}
                            onChange={(e) => setData('locacions', e.target.value)}
                        />
                        <InputError message={errors.locacions} />
                    </div>

                    {requiereEncargado && (
                        <div className="space-y-4 rounded-lg border p-4">
                            <p className="text-sm font-medium">Encargado del equipo</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="cursor-text select-text w-fit">Cédula <span className="text-destructive cursor-text select-text w-fit">*</span></Label>
                                    <Input
                                        value={data.asignado_cedula}
                                        onChange={(e) => setData('asignado_cedula', e.target.value)}
                                        placeholder="Ej. 12345678"
                                    />
                                     <InputError message={errors.asignado_cedula} />
                                </div>

                                <div className="grid gap-2">
                                    <Label cursor-text select-text w-fit>Nombre <span className="text-destructive cursor-text select-text w-fit">*</span></Label>
                                    <Input
                                        value={data.asignado_nombre}
                                        onChange={(e) => setData('asignado_nombre', e.target.value)}
                                        placeholder="Nombre"
                                    />
                                    <InputError message={errors.asignado_nombre} />
                                </div>

                                <div className="grid gap-2">
                                    <Label className="cursor-text select-text w-fit"> Apellido <span className="text-destructive cursor-text select-text w-fit">*</span></Label>
                                    <Input
                                        value={data.asignado_apellido}
                                        onChange={(e) => setData('asignado_apellido', e.target.value)}
                                        placeholder="Apellido"
                                    />
                                    <InputError message={errors.asignado_apellido} />
                                </div>

                                <div className="grid gap-2">
                                    <Label className="cursor-text select-text w-fit">Teléfono {mode === 'create' && <span className="text-muted-foreground text-xs cursor-text select-text w-fit">(opcional)</span>}</Label>
                                    <Input
                                        value={data.asignado_telefono}
                                        onChange={(e) => setData('asignado_telefono', e.target.value)}
                                        placeholder="Ej. 04121234567"
                                    />
                                    <InputError message={errors.asignado_telefono} />
                                </div>

                                <div className="grid gap-2 sm:col-span-2">
                                    <Label>Gerencia {mode === 'create' && <span className="text-muted-foreground text-xs">(opcional)</span>}</Label>
                                    <Input
                                        value={data.asignado_gerencia}
                                        onChange={(e) => setData('asignado_gerencia', e.target.value)}
                                        placeholder="Ej. Gerencia ATIT"
                                    />
                                    <InputError message={errors.asignado_gerencia} />
                                </div>
                            </div>
                        </div>
                    )}

                    {mode==='edit' && (
                        <div className="grid gap-2">
                            <Label className="cursor-text select-text w-fit">Condición <span className="text-destructive cursor-text select-text w-fit">*</span></Label>
                            <Select
                                value={data.condicion}
                                onValueChange={(val) => setData('condicion', val)}
                            >
                                <SelectTrigger className="w-full cursor-pointer">
                                    <SelectValue placeholder="Selecciona una condición" />
                                </SelectTrigger>
                                <SelectContent>
                                    {condiciones.map((c) => (
                                        <SelectItem key={c.value} value={c.value} className="cursor-pointer">
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.condicion} />
                        </div>
                    )}

                    {mode === 'create' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="cursor-text select-text w-fit">Marca <span className="text-muted-foreground text-xs cursor-text select-text w-fit">(opcional)</span></Label>
                                    <Input
                                        value={data.marca}
                                        onChange={(e) => setData('marca', e.target.value)}
                                        placeholder="Ingrese la marca del equipo..."
                                    />
                                    <InputError message={errors.marca} />
                                </div>

                                <div className="grid gap-2">
                                    <Label className="cursor-text select-text w-fit">Modelo <span className="text-destructive cursor-text select-text w-fit">*</span></Label>
                                    <Input
                                        value={data.modelo}
                                        onChange={(e) => setData('modelo', e.target.value)}
                                        placeholder="Ingrese el modelo del equipo..."
                                    />
                                    <InputError message={errors.modelo} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label className="cursor-text select-text w-fit">Serial <span className="text-destructive cursor-text select-text w-fit">*</span></Label>
                                <Input
                                    value={data.serial}
                                    onChange={(e) => {
                                        const valor = e.target.value;
                                        const formatted = formatInput('serial', valor);
                                        setData('serial', formatted)
                                    }}
                                    placeholder="Ingrese el serial del equipo..."
                                />
                                <InputError message={errors.serial} />
                            </div>
                        </>
                    )}

                    <div className="grid gap-2">
                        <Label className="cursor-text select-text w-fit">Observaciones {mode === 'create' && <span className="text-muted-foreground text-xs cursor-text select-text w-fit">(opcional)</span>}</Label>
                        <textarea
                            className="border-input flex min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                            value={data.detalle}
                            onChange={(e) => setData('detalle', e.target.value)}
                        />
                        <InputError message={errors.detalle} />
                    </div>

                    
                </CardContent>
            </Card>

            {camposActivos.length > 0 && (
                <Card className={"mt-6 " + cardForMode}>
                    <CardHeader className="flex items-center gap-2">
                        <CardTitle className="text-base">Características Técnicas</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {camposActivos.map((campo) => {
                            const config = CAMPO_CONFIG[campo] ?? { label: campo };
                            const esPasswordEnEdicion = config.type === 'password' && mode === 'edit';
                            const isRequired = ['puerto', 'contraseña_bios', 'ram', 'disco', 'sistema_operativo', 'numero_inventario', 'potencia', 'rango_frecuencia', 'unidad_usuario']

                            return (
                                <div
                                    key={campo}
                                    className={`grid gap-2 ${config.textarea ? 'sm:col-span-2' : ''}`}
                                >
                                    <Label className="cursor-text select-text w-fit">{config.label} {isRequired.includes(campo) ? (<span className="text-destructive cursor-text select-text w-fit">*</span>): (<span className="text-muted-foreground text-xs">(opcional)</span>)}</Label>
                                    { config.textarea ? (
                                        <textarea
                                            className="border-input flex min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                            value={data[campo] ?? ''}
                                            onChange={(e) => setData(campo, e.target.value)}
                                            placeholder={config.holdertext}
                                        />
                                    ) : config.type === 'password' ? (
                                        <>
                                            <PasswordInput
                                                value={data[campo] ?? ''}
                                                onChange={(e) => setData(campo, e.target.value)}
                                                placeholder={
                                                    esPasswordEnEdicion
                                                        ? 'Dejar en blanco para no cambiarla'
                                                        : 'Ingrese la contraseña...'
                                                }
                                            />
                                            {esPasswordEnEdicion && tieneContrasenaBios && (
                                                <p className="text-xs text-muted-foreground">
                                                    Ya hay una contraseña guardada. Solo se reemplaza si escribes una nueva.
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <Input
                                            value={data[campo] ?? ''}
                                            onChange={(e) => {
                                                const valor = e.target.value;
                                                const formatted = formatInput(campo, valor);
                                                setData(campo, formatted);
                                            }}
                                            placeholder = {config.holdertext}
                                        />
                                    )}
                                    <InputError message={errors[campo]} />
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}

            <div className= "flex justify-center gap-2 mt-6">
                {onCancel ? (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                ): (
                    <Button type="button" variant="outline" asChild>
                        <Link href="/equipos">
                            Cancelar
                        </Link>
                    </Button>
                )}
                <Button
                    className="cursor-pointer"
                    type="submit"
                    disabled={processing || (mode === 'edit' && !isDirty)}
                >
                    {processing && <Spinner />}
                    {mode === 'create' ? 'Guardar Equipo' : 'Actualizar Equipo'}
                </Button>
            </div>
        </form>
    );
}