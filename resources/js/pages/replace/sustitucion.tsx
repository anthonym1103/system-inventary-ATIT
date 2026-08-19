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

function RamGbInput({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    const clampCursor = (e: React.SyntheticEvent<HTMLInputElement>) => {
        const target = e.currentTarget;
        const digits = target.value.replace(/\D/g, '');
        const maxPos = digits.length;

        requestAnimationFrame(() => {
            const start = target.selectionStart ?? maxPos;
            const end = target.selectionEnd ?? maxPos;

            const clampedStart = Math.min(start, maxPos);
            const clampedEnd = Math.min(end, maxPos);

            if (start > maxPos || end > maxPos) {
                target.setSelectionRange(clampedStart, clampedEnd);
            }
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const target = e.target;
        const digits = target.value.replace(/\D/g, '').slice(0, 4);
        const formatted = digits ? `${digits} GB` : '';

        onChange(formatted);

        // El cursor siempre queda justo antes de " GB".
        requestAnimationFrame(() => {
            target.setSelectionRange(digits.length, digits.length);
        });
    };

    return (
        <Input
            value={value}
            onChange={handleChange}
            onClick={clampCursor}
            onKeyUp={clampCursor}
            onFocus={clampCursor}
            placeholder={placeholder}
            inputMode="numeric"
        />
    );
}

interface NotaEntregaFormData {
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
    entrega_disco_unidad: string;
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
    entrega_disco_unidad: 'GB',
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

// Campos que pertenecen a cada periférico, usados para limpiarlos cuando se desactiva la sección.
const PERIFERICO_PREFIJOS = ['monitor', 'teclado', 'mouse', 'regulador'] as const;

// Formatea el valor de un campo según su naturaleza, igual que hace equipo-form.tsx
// con su propia función formatInput.
const formatInput = (type: string, value: string): string => {
    switch (type) {
        case 'serial': {
            // Seriales de CPU/periféricos: mayúsculas, sin límite práctico distinto al backend (max:255)
            return value.toUpperCase().slice(0, 255);
        }
        case 'cedula': {
            // Igual formato que "asignado_cedula" en equipo-form: "V- " + hasta 9 dígitos
            const ident = 'V- ';
            const digits = value.replace(/[^0-9]/g, '');
            return ident + digits.slice(0, 9);
        }
        case 'telefono': {
            // Solo dígitos, máximo 11 (igual que equipo-form)
            const digits = value.replace(/[^0-9]/g, '');
            return digits.slice(0, 11);
        }
        case 'numero': {
            // Campos puramente numéricos (ej. capacidad de disco)
            return value.replace(/\D/g, '');
        }
        case 'nombre_usuario': {
            // Capitaliza cada palabra, igual que CreateNewUser::formatFullName en el backend
            return value
                .replace(/\s+/g, ' ')
                .split(' ')
                .map((palabra) =>
                    palabra ? palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase() : palabra,
                )
                .join(' ');
        }
        case 'correo': {
            // Normaliza a minúsculas y sin espacios, como espera cualquier validación de email
            return value.trim().toLowerCase();
        }
        default:
            return value;
    }
};

// Fila reutilizable para Marca/Modelo/Serial de un periférico
function PerifericoRow({
    label,
    prefix,
    data,
    onChange,
}: {
    label: string;
    prefix: (typeof PERIFERICO_PREFIJOS)[number];
    data: NotaEntregaFormData;
    onChange: (field: keyof NotaEntregaFormData, value: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label className="w-fit">{label}. Marca/Modelo/Serial</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                    placeholder="Marca..."
                    value={data[`${prefix}_marca` as keyof NotaEntregaFormData] as string}
                    onChange={(e) => onChange(`${prefix}_marca` as keyof NotaEntregaFormData, e.target.value)}
                />
                <Input
                    placeholder="Modelo..."
                    value={data[`${prefix}_modelo` as keyof NotaEntregaFormData] as string}
                    onChange={(e) => onChange(`${prefix}_modelo` as keyof NotaEntregaFormData, e.target.value)}
                />
                <Input
                    placeholder="Serial..."
                    value={data[`${prefix}_serial` as keyof NotaEntregaFormData] as string}
                    onChange={(e) =>
                        onChange(`${prefix}_serial` as keyof NotaEntregaFormData, formatInput('serial', e.target.value))
                    }
                />
            </div>
        </div>
    );
}

export default function Sustitucion() {
    const [data, setData] = useState<NotaEntregaFormData>(initialForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    // Los periféricos son opcionales: puede que no se entregue ninguno junto al equipo,
    // así que el bloque de campos empieza oculto hasta que el usuario indique que sí aplica.
    const [incluirPerifericos, setIncluirPerifericos] = useState(false);

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

    const toggleIncluirPerifericos = (checked: boolean) => {
        setIncluirPerifericos(checked);

        // Si el usuario desactiva la sección, se limpian los campos para no enviar
        // datos residuales que ya no corresponden a lo que se va a entregar.
        if (!checked) {
            setData((prev) => {
                const limpio = { ...prev };
                PERIFERICO_PREFIJOS.forEach((prefix) => {
                    limpio[`${prefix}_marca`] = '';
                    limpio[`${prefix}_modelo`] = '';
                    limpio[`${prefix}_serial`] = '';
                });
                return limpio;
            });
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

            const response = await fetch('/sustitucion/generar', {
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
            setIncluirPerifericos(false);
            toast.success('Nota de entrega generada correctamente.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Head title="Sustitucion" />

            <div className="p-6 w-full space-y-6">
                <Heading
                    variant="small"
                    title="Nota de Entrega"
                    description="Genera el formato de entrega/sustitución de equipo para el usuario."
                />

                <form onSubmit={handleSubmit} className="space-y-6 mx-[22%]">
                    {/* Datos del usuario */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Datos del usuario</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Nombre de usuario <span className="text-destructive">*</span></Label>
                                    <Input
                                        value={data.nombre_usuario}
                                        onChange={(e) => setField('nombre_usuario', formatInput('nombre_usuario', e.target.value))}
                                        placeholder="Ej. Juan Perez"
                                    />
                                    <InputError message={errors.nombre_usuario} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Cédula <span className="text-destructive">*</span></Label>
                                    <Input
                                        value={data.cedula}
                                        onChange={(e) => setField('cedula', formatInput('cedula', e.target.value))}
                                        placeholder="V- 12345678"
                                    />
                                    <InputError message={errors.cedula} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>N° Personal</Label>
                                    <Input 
                                        value={data.personal} 
                                        onChange={(e) => setField('personal', e.target.value)} 
                                        placeholder="N° Personal..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Teléfono</Label>
                                    <Input
                                        value={data.telefono}
                                        onChange={(e) => setField('telefono', formatInput('telefono', e.target.value))}
                                        placeholder="Ej. 04121234567"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Unidad</Label>
                                    <Input 
                                        value={data.unidad} 
                                        onChange={(e) => setField('unidad', e.target.value)} 
                                        placeholder="Unidad..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Ubicación Física</Label>
                                    <Input 
                                        value={data.ubicacion_fisica} 
                                        onChange={(e) => setField('ubicacion_fisica', e.target.value)} 
                                        placeholder="Ubicación Física..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Aliado ATIT</Label>
                                    <Input 
                                        value={data.aliado_atit} 
                                        onChange={(e) => setField('aliado_atit', e.target.value)} 
                                        placeholder="Aliado ATIT..."
                                    />
                                    {/* TODO: campo "Ext" pendiente de confirmar significado */}
                                </div>
                                <div className="grid gap-2">
                                    <Label>Personal Enlace</Label>
                                    <Input 
                                        value={data.personal_enlace} 
                                        onChange={(e) => setField('personal_enlace', e.target.value)} 
                                        placeholder="Personal Enlace..."
                                    />
                                    {/* TODO: campo "Ext" pendiente de confirmar significado */}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Equipo a entregar */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Equipo a Entregar</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label>Tipo de Equipo <span className="text-destructive">*</span></Label>
                                    <Input 
                                        value={data.entrega_tipo_equipo} 
                                        onChange={(e) => setField('entrega_tipo_equipo', e.target.value)} 
                                        placeholder="Tipo de Equipo..."
                                    />
                                    <InputError message={errors.entrega_tipo_equipo} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Marca</Label>
                                    <Input 
                                        value={data.entrega_marca} 
                                        onChange={(e) => setField('entrega_marca', e.target.value)} 
                                        placeholder="Marca..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Modelo <span className="text-destructive">*</span></Label>
                                    <Input 
                                        value={data.entrega_modelo} 
                                        onChange={(e) => setField('entrega_modelo', e.target.value)} 
                                        placeholder="Modelo..."
                                    />
                                    <InputError message={errors.entrega_modelo} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Microprocesador</Label>
                                    <Input 
                                        value={data.entrega_microprocesador} 
                                        onChange={(e) => setField('entrega_microprocesador', e.target.value)} 
                                        placeholder="Microprocesador..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Memoria RAM</Label>
                                    <RamGbInput
                                        value={data.entrega_ram}
                                        onChange={(value) => setField('entrega_ram', value)}
                                        placeholder="Ej. 8 GB"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Disco Duro</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={data.entrega_disco} 
                                            onChange={(e) => setField('entrega_disco', formatInput('numero', e.target.value))} 
                                            className="max-w-[calc(100%-6rem)]"
                                            placeholder="Ej. 500 GB."
                                        />
                                        <Select
                                            value={data.entrega_disco_unidad}
                                            onValueChange={(v) => setField('entrega_disco_unidad', v)}
                                        >
                                            <SelectTrigger className="w-24 cursor-pointer">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="GB">GB</SelectItem>
                                                <SelectItem value="TB">TB</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>CPU Serial <span className="text-destructive">*</span></Label>
                                    <Input
                                        value={data.entrega_cpu_serial}
                                        onChange={(e) => setField('entrega_cpu_serial', formatInput('serial', e.target.value))}
                                        placeholder="Serial del CPU..."
                                    />
                                    <InputError message={errors.entrega_cpu_serial} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Inmovilizado</Label>
                                    <Input 
                                        value={data.entrega_inmovilizado} 
                                        onChange={(e) => setField('entrega_inmovilizado', e.target.value)} 
                                        placeholder="Inmovilizado..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Nombre del computador</Label>
                                    <Input 
                                        value={data.nombre_computador} 
                                        onChange={(e) => setField('nombre_computador', e.target.value)} 
                                        placeholder="Nombre del computador..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Correo</Label>
                                    <Input
                                        type="email"
                                        value={data.correo}
                                        onChange={(e) => setField('correo', formatInput('correo', e.target.value))}
                                        placeholder="Correo electrónico..."
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Periféricos entregados (opcional; marcan "Componentes a retirar" automáticamente) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Periféricos entregados</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="incluir_perifericos"
                                    checked={incluirPerifericos}
                                    onCheckedChange={(c) => toggleIncluirPerifericos(Boolean(c))}
                                />
                                <Label htmlFor="incluir_perifericos" className="cursor-pointer">
                                    ¿Se entregan periféricos junto con el equipo?
                                </Label>
                            </div>

                            {incluirPerifericos ? (
                                <div className="space-y-4">
                                    <p className="text-xs text-muted-foreground">
                                        Si llenas Marca/Modelo/Serial de un periférico, se marcará automáticamente
                                        en "Componentes a retirar" del equipo sustituido.
                                    </p>
                                    <PerifericoRow label="Monitor" prefix="monitor" data={data} onChange={setField} />
                                    <PerifericoRow label="Teclado" prefix="teclado" data={data} onChange={setField} />
                                    <PerifericoRow label="Mouse" prefix="mouse" data={data} onChange={setField} />
                                    <PerifericoRow label="Regulador" prefix="regulador" data={data} onChange={setField} />
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Marca la casilla si vas a entregar monitor, teclado, mouse y/o regulador
                                    junto con el equipo.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Software */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Software a Instalar</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-6">
                                <div className="flex items-center gap-2">
                                    <Checkbox 
                                        checked={data.canaima}
                                        disabled={data.windows7} 
                                        onCheckedChange={(c) => setField('canaima', Boolean(c))} 
                                        id="canaima" 
                                    />
                                    <Label htmlFor="canaima" className="cursor-pointer">Canaima v4.1</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox 
                                        checked={data.windows7}
                                        disabled={data.canaima} 
                                        onCheckedChange={(c) => toggleWindows7(Boolean(c))} 
                                        id="windows7" 
                                    />
                                    <Label htmlFor="windows7" className="cursor-pointer">Windows 7</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox 
                                        checked={data.project} 
                                        onCheckedChange={(c) => setField('project', Boolean(c))} 
                                        id="project" 
                                    />
                                    <Label htmlFor="project" className="cursor-pointer">Project</Label>
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
                                    <Checkbox 
                                        checked={data.debian} 
                                        onCheckedChange={(c) => setField('debian', Boolean(c))} 
                                        id="debian" 
                                    />
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
                        <CardHeader>
                            <CardTitle className="text-base">Equipo a Sustituir</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label>Tipo de Equipo <span className="text-destructive">*</span></Label>
                                    <Input 
                                        value={data.sustituir_tipo_equipo} 
                                        onChange={(e) => setField('sustituir_tipo_equipo', e.target.value)} 
                                        placeholder="Tipo de equipo..."
                                    />
                                    <InputError message={errors.sustituir_tipo_equipo} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Marca</Label>
                                    <Input 
                                        value={data.sustituir_marca} 
                                        onChange={(e) => setField('sustituir_marca', e.target.value)} 
                                        placeholder="Marca..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Modelo <span className="text-destructive">*</span></Label>
                                    <Input 
                                        value={data.sustituir_modelo} 
                                        onChange={(e) => setField('sustituir_modelo', e.target.value)} 
                                        placeholder="Modelo..."
                                    />
                                    <InputError message={errors.sustituir_modelo} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Microprocesador</Label>
                                    <Input 
                                        value={data.sustituir_microprocesador} 
                                        onChange={(e) => setField('sustituir_microprocesador', e.target.value)} 
                                        placeholder="Microprocesador..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Serial CPU <span className="text-destructive">*</span></Label>
                                    <Input
                                        value={data.sustituir_serial_cpu}
                                        onChange={(e) => setField('sustituir_serial_cpu', formatInput('serial', e.target.value))}
                                        placeholder="Serial CPU..."
                                    />
                                    <InputError message={errors.sustituir_serial_cpu} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Memoria RAM</Label>
                                    <RamGbInput
                                        value={data.sustituir_ram}
                                        onChange={(value) => setField('sustituir_ram', value)}
                                        placeholder="Ej. 8 GB"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Sistema Operativo</Label>
                                    <Input 
                                        value={data.sustituir_sistema_operativo} 
                                        onChange={(e) => setField('sustituir_sistema_operativo', e.target.value)} 
                                        placeholder="Sistema Operativo..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Inventario</Label>
                                    <Input 
                                        value={data.sustituir_inventario} 
                                        onChange={(e) => setField('sustituir_inventario', e.target.value)} 
                                        placeholder="Inventario..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Nombre del computador</Label>
                                    <Input 
                                        value={data.sustituir_nombre_computador} 
                                        onChange={(e) => setField('sustituir_nombre_computador', e.target.value)} 
                                        placeholder="Nombre del computador..."
                                    />
                                </div>
                                <div className="grid gap-2 sm:col-span-2">
                                    <Label>Capacidad Disco Duro</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={data.sustituir_disco_capacidad}
                                            onChange={(e) => setField('sustituir_disco_capacidad', formatInput('numero', e.target.value))}
                                            className="max-w-[49%] min-w-[33%]"
                                            placeholder="Ej. 500 GB"
                                        />
                                        <Select
                                            value={data.sustituir_disco_unidad}
                                            onValueChange={(v) => setField('sustituir_disco_unidad', v)}
                                        >
                                            <SelectTrigger className="w-24 cursor-pointer">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="GB">GB</SelectItem>
                                                <SelectItem value="TB">TB</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-center gap-2">
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
