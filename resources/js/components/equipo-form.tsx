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
    type?: 'password';
    textarea?: boolean;
}

const CAMPO_CONFIG: Record<string, CampoConfig> = {
    anio: { label: 'Año' },
    ram: { label: 'RAM' },
    disco: { label: 'Disco' },
    direccion_mac: { label: 'Dirección MAC' },
    sistema_operativo: { label: 'Sistema Operativo' },
    numero_inventario: { label: 'Número de Inventario' },
    dominio: { label: 'Dominio' },
    puerto: { label: 'Puerto' },
    contraseña_bios: { label: 'Contraseña BIOS', type: 'password' },
    direccion_ip: { label: 'Dirección IP' },
    extension: { label: 'Extensión' },
    ubicacion_puerto: { label: 'Ubicación del Puerto' },
    potencia: { label: 'Potencia' },
    rango_frecuencia: { label: 'Rango de Frecuencia' },
    unidad_usuario: { label: 'Unidad / Usuario' },
    caracteristicas: { label: 'Características', textarea: true },
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
    const { data, setData, post, put, processing, errors, reset } = useForm<EquipoFormData>({
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

    return (
        <form onSubmit={handleSubmit}>
            <Card className = {cardForMode}>
                <CardHeader className="flex items-center gap-2">
                    <CardTitle className="text-base">Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Tipo de Equipo {mode === 'create' && <span className="text-destructive">*</span>}</Label>
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

                    <div className="grid gap-2">
                        <Label>Estado/Region {mode === 'create' && <span className="text-destructive">*</span>}</Label>
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
                        <Label>Locacion del equipo {mode === 'create' && <span className="text-destructive">*</span>}</Label>
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
                                    <Label>Cédula <span className="text-destructive">*</span></Label>
                                    <Input
                                        value={data.asignado_cedula}
                                        onChange={(e) => setData('asignado_cedula', e.target.value)}
                                        placeholder="Ej. V12345678"
                                    />
                                     <InputError message={errors.asignado_cedula} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Nombre <span className="text-destructive">*</span></Label>
                                    <Input
                                        value={data.asignado_nombre}
                                        onChange={(e) => setData('asignado_nombre', e.target.value)}
                                        placeholder="Nombre"
                                    />
                                    <InputError message={errors.asignado_nombre} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Apellido <span className="text-destructive">*</span></Label>
                                    <Input
                                        value={data.asignado_apellido}
                                        onChange={(e) => setData('asignado_apellido', e.target.value)}
                                        placeholder="Apellido"
                                    />
                                    <InputError message={errors.asignado_apellido} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Teléfono {mode === 'create' && <span className="text-muted-foreground text-xs">(opcional)</span>}</Label>
                                    <Input
                                        value={data.asignado_telefono}
                                        onChange={(e) => setData('asignado_telefono', e.target.value)}
                                        placeholder="Ej. +584121234567"
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
                            <Label>Condición <span className="text-destructive">*</span></Label>
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Marca {mode === 'create' && <span className="text-muted-foreground text-xs">(opcional)</span>}</Label>
                            <Input
                                value={data.marca}
                                onChange={(e) => setData('marca', e.target.value)}
                            />
                            <InputError message={errors.marca} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Modelo {mode === 'create' && <span className="text-destructive">*</span>}</Label>
                            <Input
                                value={data.modelo}
                                onChange={(e) => setData('modelo', e.target.value)}
                            />
                            <InputError message={errors.modelo} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Serial {mode === 'create' && <span className="text-destructive">*</span>}</Label>
                        <Input
                            value={data.serial}
                            onChange={(e) => setData('serial', e.target.value)}
                        />
                        <InputError message={errors.serial} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Observaciones {mode === 'create' && <span className="text-muted-foreground text-xs">(opcional)</span>}</Label>
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

                            return (
                                <div
                                    key={campo}
                                    className={`grid gap-2 ${config.textarea ? 'sm:col-span-2' : ''}`}
                                >
                                    <Label>{config.label}</Label>
                                    {config.textarea ? (
                                        <textarea
                                            className="border-input flex min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                            value={data[campo] ?? ''}
                                            onChange={(e) => setData(campo, e.target.value)}
                                        />
                                    ) : config.type === 'password' ? (
                                        <>
                                            <PasswordInput
                                                value={data[campo] ?? ''}
                                                onChange={(e) => setData(campo, e.target.value)}
                                                placeholder={
                                                    esPasswordEnEdicion
                                                        ? 'Dejar en blanco para no cambiarla'
                                                        : undefined
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
                                            onChange={(e) => setData(campo, e.target.value)}
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
                <Button className= "cursor-pointer"  type="submit" disabled={processing}>
                    {processing && <Spinner />}
                    {mode === 'create' ? 'Guardar Equipo' : 'Actualizar Equipo'}
                </Button>
            </div>
        </form>
    );
}