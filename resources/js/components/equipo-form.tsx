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

export interface UbicacionOption {
    id: number;
    estado: string;
    locacion: string;
}

export interface AsignadoOption {
    cedula: string;
    nombre: string;
    apellido: string;
}

export type EquipoFormData = {
    tipo: string;
    ubicacion_id: string;
    asignado_id: string;
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
    ubicaciones: UbicacionOption[];
    asignados: AsignadoOption[];
    initialData?: Partial<EquipoFormData>;
    tieneContrasenaBios?: boolean;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function EquipoForm({mode, equipoId, tiposLabels, camposPorTipo, ubicaciones, asignados, initialData, tieneContrasenaBios = false, onSuccess, onCancel }: EquipoFormProps) {
    const { data, setData, post, put, processing, errors, reset } = useForm<EquipoFormData>({
        tipo: '',
        ubicacion_id: '',
        asignado_id: '',
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
        const limpios: Record<string, string> = {};

        nuevosCampos.forEach((campo) => {
            // Si el campo ya estaba activo con el tipo anterior, conservamos
            // su valor; si es nuevo para este tipo, lo dejamos vacío.
            limpios[campo] = camposActivos.includes(campo) ? data[campo] ?? '' : '';
        });

        setData((prev) => ({
            ...prev,
            tipo: nuevoTipo,
            asignado_id: camposPorTipo[nuevoTipo]?.requiereEncargado ? prev.asignado_id : '',
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
                        <Label>Tipo de Equipo</Label>
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
                        <Label>Ubicación</Label>
                        <Select
                            value={data.ubicacion_id}
                            onValueChange={(val) => setData('ubicacion_id', val)}
                        >
                            <SelectTrigger className="w-full cursor-pointer">
                                <SelectValue placeholder="Selecciona una ubicación" />
                            </SelectTrigger>
                            <SelectContent>
                                {ubicaciones.map((u) => (
                                    <SelectItem key={u.id} value={String(u.id)} className="cursor-pointer">
                                        {u.locacion}, {u.estado}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.ubicacion_id} />
                    </div>

                    {requiereEncargado && (
                        <div className="grid gap-2">
                            <Label>Encargado</Label>
                            <Select
                                value={data.asignado_id}
                                onValueChange={(val) => setData('asignado_id', val)}
                            >
                                <SelectTrigger className="w-full cursor-pointer">
                                    <SelectValue placeholder="Selecciona un encargado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {asignados.map((a) => (
                                        <SelectItem key={a.cedula} value={a.cedula} className="cursor-pointer">
                                            {a.nombre} {a.apellido} — {a.cedula}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.asignado_id} />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Marca</Label>
                            <Input
                                value={data.marca}
                                onChange={(e) => setData('marca', e.target.value)}
                            />
                            <InputError message={errors.marca} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Modelo</Label>
                            <Input
                                value={data.modelo}
                                onChange={(e) => setData('modelo', e.target.value)}
                            />
                            <InputError message={errors.modelo} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Serial</Label>
                        <Input
                            value={data.serial}
                            onChange={(e) => setData('serial', e.target.value)}
                        />
                        <InputError message={errors.serial} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Observaciones</Label>
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