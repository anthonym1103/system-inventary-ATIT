import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from './ui/checkbox';

// Valor centinela para la opción "Otro" del <Select> de tipo. No se guarda
// nunca en base de datos: solo sirve para alternar a modo "texto libre".
const TIPO_PERSONALIZADO = '__personalizado__';
const SEDE_PERSONALIZADA = '__sede_personalizada__';
const PISO_PERSONALIZADA = '__piso_personalizada__';

const asText = (value: string | boolean | undefined): string =>
    typeof value === 'string' ? value : '';

export type EquipoFormData = {
    tipo: string;
    estados: string;
    sedes: string;
    pisos: string;
    condicion: string;
    con_encargado: boolean;
    asignado_cedula: string;
    asignado_nombre: string;
    asignado_apellido: string;
    asignado_telefono: string;
    asignado_gerencia: string;
    marca: string;
    modelo: string;
    serial: string;
    numero_inventario: string;
    detalle: string;
    // Reemplaza a los antiguos campos por tipo (ram, disco, puerto,
    // dirección IP, etc). El usuario escribe libremente lo que necesite.
    caracteristicas: string;
};

interface EquipoFormProps {
    mode: 'create' | 'edit';
    equipoId?: number;
    tiposLabels: Record<string, string>;
    ubicaciones: Array<{ value: string; label: string }>;
    sedesOptions: Array<{ value: string; label: string; region: string }>;
    pisosOptions: Array<{ value: string; label: string }>;
    condiciones: Array<{ value: string; label: string }>;
    initialData?: Partial<EquipoFormData>;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function EquipoForm({
    mode,
    equipoId,
    tiposLabels,
    ubicaciones,
    sedesOptions,
    pisosOptions,
    condiciones,
    initialData,
    onSuccess,
    onCancel,
}: EquipoFormProps) {
    const { data, setData, post, put, processing, errors, reset, isDirty } = useForm<EquipoFormData>({
        tipo: '',
        estados: '',
        sedes: '',
        pisos: '',
        condicion: 'operativo',
        con_encargado: false,
        asignado_cedula: '',
        asignado_nombre: '',
        asignado_apellido: '',
        asignado_telefono: '',
        asignado_gerencia: '',
        marca: '',
        modelo: '',
        serial: '',
        numero_inventario: '',
        detalle: '',
        caracteristicas: '',
        ...initialData,
    });

    // Si el tipo inicial no está en el catálogo (por ejemplo, alguien ya
    // escribió uno personalizado antes), arrancamos directo en modo texto
    // libre para que se vea tal cual se guardó.
    const [tipoPersonalizado, setTipoPersonalizado] = useState<boolean>(
        () => Boolean(initialData?.tipo) && !tiposLabels[initialData!.tipo as string],
    );
    const [sedePersonalizada, setSedePersonalizada] = useState<boolean>(
        () => Boolean(initialData?.sedes) && !sedesOptions.some((s) => s.value === initialData!.sedes),
    );
    const [pisoPersonalizada, setPisoPersonalizada] = useState<boolean>(
        () => Boolean(initialData?.pisos) && !pisosOptions.some((p) => p.value === initialData!.pisos),
    );


    const sedesFiltradas = useMemo(
        () => sedesOptions.filter((s) => s.region === data.estados),
        [sedesOptions, data.estados],
    );
    const mostrarEncargado = mode === 'edit' || Boolean(data.tipo);
    const cardForMode = mode === 'create' ? 'mx-[22%]' : '';

    const handleTipoSelectChange = (valor: string) => {
        if (valor === TIPO_PERSONALIZADO) {
            setTipoPersonalizado(true);
            setData('tipo', '');
            return;
        }

        setTipoPersonalizado(false);
        setData('tipo', valor);
    };

    const handleSedeSelectChange = (valor: string) => {
        if (valor === SEDE_PERSONALIZADA) {
            setSedePersonalizada(true);
            setData((prev) => ({ ...prev, sedes: '', pisos: '' }));
            return;
        }
        setSedePersonalizada(false);
        setData((prev) => ({ ...prev, sedes: valor, pisos: '' }));
    };

    const handlePisoSelectChange = (valor: string) => {
        if (valor === PISO_PERSONALIZADA) {
            setPisoPersonalizada(true);
            setData('pisos', '');
            return;
        }
        setPisoPersonalizada(false);
        setData('pisos', valor);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (mode === 'create') {
            post('/equipos', {
                onSuccess: () => {
                    reset();
                    onSuccess?.();
                },
            });
        } else if (equipoId) {
            put(`/equipos/${equipoId}`, {
                onSuccess: () => {
                    onSuccess?.();
                },
            });
        }
    };

    const formatInput = (type: string, value: string): string => {
        var limited = '';
        switch (type) {
            case 'serial': {
                const valueUpper = value.toUpperCase();
                limited = valueUpper.slice(0, 255);
                return limited;
            }
            case 'telefono': {
                const number = value.replace(/[^0-9]/g, '');
                limited = number.slice(0, 11);
                return limited;
            }
            case 'cedula': {
                const ident = 'V- ';
                const digCedula = value.replace(/[^0-9]/g, '');
                limited = digCedula.slice(0, 9);
                return ident + limited;
            }
            default:
                return value;
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card className={cardForMode}>
                <CardHeader className="flex items-center gap-1">
                    <CardTitle className="text-base">Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {mode === 'create' && (
                        <div className="grid gap-2">
                            <Label className="cursor-text select-text w-fit">
                                Tipo de Equipo <span className="text-destructive cursor-text select-text w-fit">*</span>
                            </Label>
                            <Select
                                value={tipoPersonalizado ? TIPO_PERSONALIZADO : data.tipo}
                                onValueChange={handleTipoSelectChange}
                            >
                                <SelectTrigger className="w-full cursor-pointer">
                                    <SelectValue placeholder="Selecciona un tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(tiposLabels).map(([value, label]) => (
                                        <SelectItem key={value} value={value} className="cursor-pointer">
                                            {label}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value={TIPO_PERSONALIZADO} className="cursor-pointer">
                                        Otro (especificar)
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {tipoPersonalizado && (
                                <Input
                                    value={data.tipo}
                                    onChange={(e) => setData('tipo', e.target.value)}
                                    placeholder="Escribe el tipo de equipo..."
                                    autoFocus
                                />
                            )}
                            <InputError message={errors.tipo} />
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label className="cursor-text select-text w-fit">
                            Estado/Region <span className="text-destructive cursor-text select-text w-fit">*</span>
                        </Label>
                        <Select
                            value={data.estados}
                            onValueChange={(val) =>
                                setData((prev) => ({
                                    ...prev,
                                    estados: val,
                                    sedes: '',
                                    pisos: '',
                                }))
                            }
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label className="cursor-text select-text w-fit">
                                Sede <span className="text-destructive cursor-text select-text w-fit">*</span>
                            </Label>
                            <Select
                                value={sedePersonalizada ? SEDE_PERSONALIZADA : data.sedes}
                                onValueChange={handleSedeSelectChange}
                                disabled={!data.estados}
                            >
                                <SelectTrigger className="w-full cursor-pointer">
                                    <SelectValue placeholder={data.estados ? 'Selecciona una sede' : 'Elige primero un estado'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sedesFiltradas.map((s) => (
                                        <SelectItem key={s.value} value={s.value} className="cursor-pointer">
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value={SEDE_PERSONALIZADA} className="cursor-pointer">
                                        Otro (especificar)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {sedePersonalizada && (
                                <Input
                                    value={data.sedes}
                                    onChange={(e) => setData((prev) => ({ ...prev, sedes: e.target.value, pisos: '' }))}
                                    placeholder="Escribe la sede..."
                                    autoFocus
                                />
                            )}
                            <InputError message={errors.sedes} />
                        </div>

                        <div className="grid gap-2">
                            <Label className="cursor-text select-text w-fit">
                                Piso <span className="text-destructive cursor-text select-text w-fit">*</span>
                            </Label>
                            <Select
                                value={pisoPersonalizada ? PISO_PERSONALIZADA : data.pisos}
                                onValueChange={handlePisoSelectChange}
                                disabled={!data.sedes}
                            >
                                <SelectTrigger className="w-full cursor-pointer">
                                    <SelectValue placeholder={data.sedes ? 'Selecciona un piso' : 'Elige primero una sede'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {pisosOptions.map((p) => (
                                        <SelectItem key={p.value} value={p.value} className="cursor-pointer">
                                            {p.label}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value={PISO_PERSONALIZADA} className="cursor-pointer">
                                        Otro (especificar)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {pisoPersonalizada && (
                                <Input
                                    value={data.pisos}
                                    onChange={(e) => setData('pisos', e.target.value)}
                                    placeholder="Escribe el piso..."
                                />
                            )}
                            <InputError message={errors.pisos} />
                        </div>
                    </div>

                    {mostrarEncargado && (
                        <div className="space-y-4 rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Encargado del equipo</p>
                                    <p className="text-xs text-muted-foreground">
                                        Indica si este equipo estará asignado a una persona.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="con-encargado"
                                        checked={data.con_encargado}
                                        onCheckedChange={(checked) => {
                                            const value = Boolean(checked);

                                            setData((prev) => ({
                                                ...prev,
                                                con_encargado: value,
                                                ...(!value && {
                                                    asignado_cedula: '',
                                                    asignado_nombre: '',
                                                    asignado_apellido: '',
                                                    asignado_telefono: '',
                                                    asignado_gerencia: '',
                                                }),
                                            }));
                                        }}
                                        className="cursor-pointer"
                                    />
                                    <Label htmlFor="con-encargado" className="text-sm cursor-pointer">
                                        Sí, asignar
                                    </Label>
                                </div>
                            </div>

                            {data.con_encargado && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="cursor-text select-text w-fit">
                                            Cédula <span className="text-destructive cursor-text select-text w-fit">*</span>
                                        </Label>
                                        <Input
                                            value={data.asignado_cedula}
                                            onChange={(e) => {
                                                const formatted = formatInput('cedula', e.target.value);
                                                setData('asignado_cedula', formatted);
                                            }}
                                            placeholder="Ej. 12345678"
                                        />
                                        <InputError message={errors.asignado_cedula} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label className="cursor-text select-text w-fit">
                                            Nombre <span className="text-destructive cursor-text select-text w-fit">*</span>
                                        </Label>
                                        <Input
                                            value={data.asignado_nombre}
                                            onChange={(e) => setData('asignado_nombre', e.target.value)}
                                            placeholder="Nombre"
                                        />
                                        <InputError message={errors.asignado_nombre} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label className="cursor-text select-text w-fit">
                                            Apellido <span className="text-destructive cursor-text select-text w-fit">*</span>
                                        </Label>
                                        <Input
                                            value={data.asignado_apellido}
                                            onChange={(e) => setData('asignado_apellido', e.target.value)}
                                            placeholder="Apellido"
                                        />
                                        <InputError message={errors.asignado_apellido} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label className="cursor-text select-text w-fit">
                                            Teléfono{' '}
                                            {mode === 'create' && (
                                                <span className="text-muted-foreground text-xs cursor-text select-text w-fit">(opcional)</span>
                                            )}
                                        </Label>
                                        <Input
                                            value={data.asignado_telefono}
                                            onChange={(e) => {
                                                const formatted = formatInput('telefono', e.target.value);
                                                setData('asignado_telefono', formatted);
                                            }}
                                            placeholder="Ej. 04121234567"
                                        />
                                        <InputError message={errors.asignado_telefono} />
                                    </div>

                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label>
                                            Gerencia {mode === 'create' && <span className="text-muted-foreground text-xs">(opcional)</span>}
                                        </Label>
                                        <Input
                                            value={data.asignado_gerencia}
                                            onChange={(e) => setData('asignado_gerencia', e.target.value)}
                                            placeholder="Ej. Gerencia ATIT"
                                        />
                                        <InputError message={errors.asignado_gerencia} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'edit' && (
                        <div className="grid gap-2">
                            <Label className="cursor-text select-text w-fit">
                                Condición <span className="text-destructive cursor-text select-text w-fit">*</span>
                            </Label>
                            <Select value={data.condicion} onValueChange={(val) => setData('condicion', val)}>
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
                                    <Label className="cursor-text select-text w-fit">
                                        Marca <span className="text-muted-foreground text-xs cursor-text select-text w-fit">(opcional)</span>
                                    </Label>
                                    <Input
                                        value={data.marca}
                                        onChange={(e) => setData('marca', e.target.value)}
                                        placeholder="Ingrese la marca del equipo..."
                                    />
                                    <InputError message={errors.marca} />
                                </div>

                                <div className="grid gap-2">
                                    <Label className="cursor-text select-text w-fit">
                                        Modelo <span className="text-destructive cursor-text select-text w-fit">*</span>
                                    </Label>
                                    <Input
                                        value={data.modelo}
                                        onChange={(e) => setData('modelo', e.target.value)}
                                        placeholder="Ingrese el modelo del equipo..."
                                    />
                                    <InputError message={errors.modelo} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label className="cursor-text select-text w-fit">
                                    Serial <span className="text-destructive cursor-text select-text w-fit">*</span>
                                </Label>
                                <Input
                                    value={data.serial}
                                    onChange={(e) => {
                                        const formatted = formatInput('serial', e.target.value);
                                        setData('serial', formatted);
                                    }}
                                    placeholder="Ingrese el serial del equipo..."
                                />
                                <InputError message={errors.serial} />
                            </div>
                        </>
                    )}

                    <div className="grid gap-2">
                        <Label className="cursor-text select-text w-fit">
                            N° Inventario <span className="text-muted-foreground text-xs cursor-text select-text w-fit">(opcional)</span>
                        </Label>
                        <Input
                            value={data.numero_inventario}
                            onChange={(e) => setData('numero_inventario', e.target.value)}
                            placeholder="Ingrese el numero de inventario del equipo..."
                        />
                        <InputError message={errors.numero_inventario} />
                    </div>

                    <div className="grid gap-2">
                        <Label className="cursor-text select-text w-fit">
                            Observaciones{' '}
                            {mode === 'create' && <span className="text-muted-foreground text-xs cursor-text select-text w-fit">(opcional)</span>}
                        </Label>
                        <textarea
                            className="border-input flex min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                            value={data.detalle}
                            onChange={(e) => setData('detalle', e.target.value)}
                        />
                        <InputError message={errors.detalle} />
                    </div>
                </CardContent>
            </Card>

            <Card className={'mt-6 ' + cardForMode}>
                <CardHeader className="flex items-center gap-2">
                    <CardTitle className="text-base">Características Técnicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <textarea
                        className="border-input flex min-h-32 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        value={data.caracteristicas}
                        onChange={(e) => setData('caracteristicas', e.target.value)}
                        placeholder="Indique las caracteristicas tecnicas del equipo..."
                    />
                    <InputError message={errors.caracteristicas} />
                </CardContent>
            </Card>

            <div className="flex justify-center gap-2 mt-6">
                {onCancel ? (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                ) : (
                    <Button type="button" variant="outline" asChild>
                        <Link href="/equipos">Cancelar</Link>
                    </Button>
                )}
                <Button className="cursor-pointer" type="submit" disabled={processing || (mode === 'edit' && !isDirty)}>
                    {processing && <Spinner />}
                    {mode === 'create' ? 'Guardar Equipo' : 'Actualizar Equipo'}
                </Button>
            </div>
        </form>
    );
}