import { Head } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { edit as editSustitucion } from '@/routes/sustitucion';

interface SustitucionFormData {
    nuevo_tipo: string;
    nuevo_marca: string;
    nuevo_modelo: string;
    nuevo_serial: string;
    viejo_tipo: string;
    viejo_marca: string;
    viejo_modelo: string;
    viejo_serial: string;
    motivo: string;
}

const initialForm: SustitucionFormData = {
    nuevo_tipo: '', nuevo_marca: '', nuevo_modelo: '', nuevo_serial: '',
    viejo_tipo: '', viejo_marca: '', viejo_modelo: '', viejo_serial: '',
    motivo: '',
};

export default function Sustitucion() {
    const [data, setData] = useState<SustitucionFormData>(initialForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const setField = (field: keyof SustitucionFormData, value: string) => {
        setData((prev) => ({ ...prev, [field]: value }));
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
            a.download = `sustitucion_equipo_${Date.now()}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
            setData(initialForm);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Head title="Configuracion" />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Sustitución de equipos"
                    description="Genera el formato indicando los datos del equipo nuevo y del equipo a sustituir."
                />

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader><CardTitle className="text-base">Equipo Nuevo</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Tipo</Label>
                                    <Input value={data.nuevo_tipo} onChange={(e) => setField('nuevo_tipo', e.target.value)} placeholder="Ej. Computador portátil" />
                                    <InputError message={errors.nuevo_tipo} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Marca</Label>
                                    <Input value={data.nuevo_marca} onChange={(e) => setField('nuevo_marca', e.target.value)} />
                                    <InputError message={errors.nuevo_marca} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Modelo</Label>
                                    <Input value={data.nuevo_modelo} onChange={(e) => setField('nuevo_modelo', e.target.value)} />
                                    <InputError message={errors.nuevo_modelo} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Serial</Label>
                                    <Input value={data.nuevo_serial} onChange={(e) => setField('nuevo_serial', e.target.value)} />
                                    <InputError message={errors.nuevo_serial} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-base">Equipo a Sustituir</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Tipo</Label>
                                    <Input value={data.viejo_tipo} onChange={(e) => setField('viejo_tipo', e.target.value)} />
                                    <InputError message={errors.viejo_tipo} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Marca</Label>
                                    <Input value={data.viejo_marca} onChange={(e) => setField('viejo_marca', e.target.value)} />
                                    <InputError message={errors.viejo_marca} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Modelo</Label>
                                    <Input value={data.viejo_modelo} onChange={(e) => setField('viejo_modelo', e.target.value)} />
                                    <InputError message={errors.viejo_modelo} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Serial</Label>
                                    <Input value={data.viejo_serial} onChange={(e) => setField('viejo_serial', e.target.value)} />
                                    <InputError message={errors.viejo_serial} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-2">
                        <Label>Motivo (opcional)</Label>
                        <textarea
                            className="border-input flex min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                            value={data.motivo}
                            onChange={(e) => setField('motivo', e.target.value)}
                        />
                        <InputError message={errors.motivo} />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing} className="cursor-pointer">
                            {processing && <Spinner />}
                            Generar PDF
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

Sustitucion.layout = {
    breadcrumbs: [
        {
            title: 'Sustitución de equipos',
            href: editSustitucion(),
        },
    ],
};