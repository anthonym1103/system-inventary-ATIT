import { Head } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface NotaEntregaFormData {
    rotacion: boolean;
    personal: string;
    telefono: string;
    nombre_usuario: string;
    cedula: string;
    unidad: string;
    ubicacion_fisica: string;
    aliado_atit: string;
    personal_enlace: string;

    entrega_tipo_equipo: string;
    entrega_marca: string;
    entrega_modelo: string;
    entrega_microprocesador: string;
    entrega_ram: string;
    entrega_disco: string;
    entrega_cpu_serial: string;
    entrega_inmovilizado: string;

    monitor_marca: string;
    monitor_modelo: string;
    monitor_serial: string;
    teclado_marca: string;
    teclado_modelo: string;
    teclado_serial: string;
    mouse_marca: string;
    mouse_modelo: string;
    mouse_serial: string;
    regulador_marca: string;
    regulador_modelo: string;
    regulador_serial: string;

    nombre_computador: string;
    correo: string;

    canaima: boolean;
    project: boolean;
    windows7: boolean;
    autocad: boolean;
    debian: boolean;
    virtualizacion: string;

    sustituir_tipo_equipo: string;
    sustituir_marca: string;
    sustituir_modelo: string;
    sustituir_microprocesador: string;
    sustituir_serial_cpu: string;
    sustituir_ram: string;
    sustituir_sistema_operativo: string;
    sustituir_inventario: string;
    sustituir_nombre_computador: string;
    sustituir_disco_capacidad: string;
    sustituir_disco_unidad: 'MB' | 'GB';
}

const initialForm: NotaEntregaFormData = {
    rotacion: false,
    personal: '',
    telefono: '',
    nombre_usuario: '',
    cedula: '',
    unidad: '',
    ubicacion_fisica: '',
    aliado_atit: '',
    personal_enlace: '',

    entrega_tipo_equipo: '',
    entrega_marca: '',
    entrega_modelo: '',
    entrega_microprocesador: '',
    entrega_ram: '',
    entrega_disco: '',
    entrega_cpu_serial: '',
    entrega_inmovilizado: '',

    monitor_marca: '', monitor_modelo: '', monitor_serial: '',
    teclado_marca: '', teclado_modelo: '', teclado_serial: '',
    mouse_marca: '', mouse_modelo: '', mouse_serial: '',
    regulador_marca: '', regulador_modelo: '', regulador_serial: '',

    nombre_computador: '',
    correo: '',

    canaima: false,
    project: false,
    windows7: false,
    autocad: false,
    debian: false,
    virtualizacion: '',

    sustituir_tipo_equipo: '',
    sustituir_marca: '',
    sustituir_modelo: '',
    sustituir_microprocesador: '',
    sustituir_serial_cpu: '',
    sustituir_ram: '',
    sustituir_sistema_operativo: '',
    sustituir_inventario: '',
    sustituir_nombre_computador: '',
    sustituir_disco_capacidad: '',
    sustituir_disco_unidad: 'GB',
};

// Fila reutilizable para Marca/Modelo/Serial de un periférico
function PerifericoRow({
    label,
    prefix,
    data,
    onChange,
}: {
    label: string;
    prefix: 'monitor' | 'teclado' | 'mouse' | 'regulador';
    data: NotaEntregaFormData;
    onChange: (field: keyof NotaEntregaFormData, value: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label className="w-fit">{label}. Marca/Modelo/Serial</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                    placeholder="Marca"
                    value={data[`${prefix}_marca` as keyof NotaEntregaFormData] as string}
                    onChange={(e) => onChange(`${prefix}_marca` as keyof NotaEntregaFormData, e.target.value)}
                />
                <Input
                    placeholder="Modelo"
                    value={data[`${prefix}_modelo` as keyof NotaEntregaFormData] as string}
                    onChange={(e) => onChange(`${prefix}_modelo` as keyof NotaEntregaFormData, e.target.value)}
                />
                <Input
                    placeholder="Serial"
                    value={data[`${prefix}_serial` as keyof NotaEntregaFormData] as string}
                    onChange={(e) => onChange(`${prefix}_serial` as keyof NotaEntregaFormData, e.target.value)}
                />
            </div>
        </div>
    );
}

export default function Sustitucion() {
    const [data, setData] = useState<NotaEntregaFormData>(initialForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const setField = (field: keyof NotaEntregaFormData, value: string | boolean) => {
        setData((prev) => ({ ...prev, [field]: value }));
    };

    const toggleWindows7 = (checked: boolean) => {
        setData((prev) => ({
            ...prev,
            windows7: checked,
            // Si se desmarca Windows 7, AutoCad 2007 no puede quedar marcado
            autocad: checked ? prev.autocad : false,
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

            const response = await fetch('/settings/sustitucion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const contentType = response.headers.get('content-type') ?? '';

                if (response.status === 422 && contentType.includes('application/json')) {
                    const body = await response.json();
                    const flat: Record<string, string> = {};
                    Object.entries(body.errors ?? {}).forEach(([key, msgs]) => {
                        flat[key] = Array.isArray(msgs) ? msgs[0] : String(msgs);
                    });
                    setErrors(flat);
                } else if (contentType.includes('application/json')) {
                    const body = await response.json();
                    toast.error(body.message || 'No se pudo generar el PDF.');
                }
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nota_entrega_${Date.now()}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
            setData(initialForm);
            toast.success('Nota de entrega generada correctamente.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Head title="Sustitucion" />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Nota de Entrega"
                    description="Genera el formato de entrega/sustitución de equipo para el usuario."
                />

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Encabezado */}
                    <Card>
                        <CardHeader><CardTitle className="text-base">Datos del usuario</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="rotacion"
                                    checked={data.rotacion}
                                    onCheckedChange={(c) => setField('rotacion', Boolean(c))}
                                />
                                <Label htmlFor="rotacion" className="cursor-pointer">Rotación</Label>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Nombre de usuario <span className="text-destructive">*</span></Label>
                                    <Input value={data.nombre_usuario} onChange={(e) => setField('nombre_usuario', e.target.value)} />
                                    <InputError message={errors.nombre_usuario} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Cédula <span className="text-destructive">*</span></Label>
                                    <Input value={data.cedula} onChange={(e) => setField('cedula', e.target.value)} />
                                    <InputError message={errors.cedula} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>N° Personal</Label>
                                    <Input value={data.personal} onChange={(e) => setField('personal', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Teléfono</Label>
                                    <Input value={data.telefono} onChange={(e) => setField('telefono', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Unidad</Label>
                                    <Input value={data.unidad} onChange={(e) => setField('unidad', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Ubicación Física</Label>
                                    <Input value={data.ubicacion_fisica} onChange={(e) => setField('ubicacion_fisica', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Aliado ATIT</Label>
                                    <Input value={data.aliado_atit} onChange={(e) => setField('aliado_atit', e.target.value)} />
                                    {/* TODO: campo "Ext" pendiente de confirmar significado */}
                                </div>
                                <div className="grid gap-2">
                                    <Label>Personal Enlace</Label>
                                    <Input value={data.personal_enlace} onChange={(e) => setField('personal_enlace', e.target.value)} />
                                    {/* TODO: campo "Ext" pendiente de confirmar significado */}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Equipo a entregar */}
                    <Card>
                        <CardHeader><CardTitle className="text-base">Equipo a Entregar</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label>Tipo de Equipo <span className="text-destructive">*</span></Label>
                                    <Input value={data.entrega_tipo_equipo} onChange={(e) => setField('entrega_tipo_equipo', e.target.value)} />
                                    <InputError message={errors.entrega_tipo_equipo} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Marca</Label>
                                    <Input value={data.entrega_marca} onChange={(e) => setField('entrega_marca', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Modelo <span className="text-destructive">*</span></Label>
                                    <Input value={data.entrega_modelo} onChange={(e) => setField('entrega_modelo', e.target.value)} />
                                    <InputError message={errors.entrega_modelo} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Microprocesador</Label>
                                    <Input value={data.entrega_microprocesador} onChange={(e) => setField('entrega_microprocesador', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Memoria RAM</Label>
                                    <Input value={data.entrega_ram} onChange={(e) => setField('entrega_ram', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Disco Duro</Label>
                                    <Input value={data.entrega_disco} onChange={(e) => setField('entrega_disco', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>CPU Serial <span className="text-destructive">*</span></Label>
                                    <Input value={data.entrega_cpu_serial} onChange={(e) => setField('entrega_cpu_serial', e.target.value)} />
                                    <InputError message={errors.entrega_cpu_serial} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Inmovilizado</Label>
                                    <Input value={data.entrega_inmovilizado} onChange={(e) => setField('entrega_inmovilizado', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Nombre del computador</Label>
                                    <Input value={data.nombre_computador} onChange={(e) => setField('nombre_computador', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Correo</Label>
                                    <Input type="email" value={data.correo} onChange={(e) => setField('correo', e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Periféricos entregados (marcan "Componentes a retirar" automáticamente) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Periféricos entregados</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-muted-foreground">
                                Si llenas Marca/Modelo/Serial de un periférico, se marcará automáticamente
                                en "Componentes a retirar" del equipo sustituido.
                            </p>
                            <PerifericoRow label="Monitor" prefix="monitor" data={data} onChange={setField} />
                            <PerifericoRow label="Teclado" prefix="teclado" data={data} onChange={setField} />
                            <PerifericoRow label="Mouse" prefix="mouse" data={data} onChange={setField} />
                            <PerifericoRow label="Regulador" prefix="regulador" data={data} onChange={setField} />
                        </CardContent>
                    </Card>

                    {/* Software */}
                    <Card>
                        <CardHeader><CardTitle className="text-base">Software a Instalar</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-6">
                                <div className="flex items-center gap-2">
                                    <Checkbox checked={data.canaima} onCheckedChange={(c) => setField('canaima', Boolean(c))} id="canaima" />
                                    <Label htmlFor="canaima" className="cursor-pointer">Canaima v4.1</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox checked={data.project} onCheckedChange={(c) => setField('project', Boolean(c))} id="project" />
                                    <Label htmlFor="project" className="cursor-pointer">Project</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox checked={data.windows7} onCheckedChange={(c) => toggleWindows7(Boolean(c))} id="windows7" />
                                    <Label htmlFor="windows7" className="cursor-pointer">Windows 7</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={data.autocad}
                                        disabled={!data.windows7}
                                        onCheckedChange={(c) => setField('autocad', Boolean(c))}
                                        id="autocad"
                                    />
                                    <Label htmlFor="autocad" className={data.windows7 ? 'cursor-pointer' : 'cursor-not-allowed text-muted-foreground'}>
                                        AutoCad 2007 {!data.windows7 && '(requiere Windows 7)'}
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox checked={data.debian} onCheckedChange={(c) => setField('debian', Boolean(c))} id="debian" />
                                    <Label htmlFor="debian" className="cursor-pointer">Debian</Label>
                                </div>
                            </div>
                            <InputError message={errors.autocad} />

                            <div className="grid gap-2 max-w-sm">
                                <Label>Virtualización</Label>
                                <Input value={data.virtualizacion} onChange={(e) => setField('virtualizacion', e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Equipo a sustituir */}
                    <Card>
                        <CardHeader><CardTitle className="text-base">Equipo a Sustituir</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label>Tipo de Equipo <span className="text-destructive">*</span></Label>
                                    <Input value={data.sustituir_tipo_equipo} onChange={(e) => setField('sustituir_tipo_equipo', e.target.value)} />
                                    <InputError message={errors.sustituir_tipo_equipo} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Marca</Label>
                                    <Input value={data.sustituir_marca} onChange={(e) => setField('sustituir_marca', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Modelo <span className="text-destructive">*</span></Label>
                                    <Input value={data.sustituir_modelo} onChange={(e) => setField('sustituir_modelo', e.target.value)} />
                                    <InputError message={errors.sustituir_modelo} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Microprocesador</Label>
                                    <Input value={data.sustituir_microprocesador} onChange={(e) => setField('sustituir_microprocesador', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Serial CPU <span className="text-destructive">*</span></Label>
                                    <Input value={data.sustituir_serial_cpu} onChange={(e) => setField('sustituir_serial_cpu', e.target.value)} />
                                    <InputError message={errors.sustituir_serial_cpu} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Memoria RAM</Label>
                                    <Input value={data.sustituir_ram} onChange={(e) => setField('sustituir_ram', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Sistema Operativo</Label>
                                    <Input value={data.sustituir_sistema_operativo} onChange={(e) => setField('sustituir_sistema_operativo', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Inventario</Label>
                                    <Input value={data.sustituir_inventario} onChange={(e) => setField('sustituir_inventario', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Nombre del computador</Label>
                                    <Input value={data.sustituir_nombre_computador} onChange={(e) => setField('sustituir_nombre_computador', e.target.value)} />
                                </div>
                                <div className="grid gap-2 sm:col-span-2">
                                    <Label>Capacidad Disco Duro</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={data.sustituir_disco_capacidad}
                                            onChange={(e) => setField('sustituir_disco_capacidad', e.target.value)}
                                            placeholder="Ej. 500"
                                        />
                                        <Select
                                            value={data.sustituir_disco_unidad}
                                            onValueChange={(v) => setField('sustituir_disco_unidad', v)}
                                        >
                                            <SelectTrigger className="w-24 cursor-pointer">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MB">MB</SelectItem>
                                                <SelectItem value="GB">GB</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing} className="cursor-pointer">
                            {processing && <Spinner />}
                            Generar Nota de Entrega
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

Sustitucion.layout = {
    breadcrumbs: [
        { title: 'Sustitución', href: '/sustitucion' },
    ],
};