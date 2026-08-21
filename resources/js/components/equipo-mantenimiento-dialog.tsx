import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';

interface Props {
    equipo: { id: number; marca: string; modelo: string } | null;
    isOpen: boolean;
    onClose: () => void;
}

export function EquipoMantenimientoDialog({ equipo, isOpen, onClose }: Props) {
    const { data, setData, post, transform, processing, errors, reset } = useForm({
        fecha_mantenimiento: '',
        detalle: '',
    });

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            reset();
            onClose();
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!equipo) return;

        transform((formData) => ({ ...formData, equipo_id: equipo.id }));

        post('/mantenimientos', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    if (!equipo) return null;

    const today = new Date().toLocaleDateString('en-CA');
    
    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Programar mantenimiento</DialogTitle>
                    <DialogDescription>
                        Recibirás una notificación en la fecha indicada, para este equipo
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="fecha_mantenimiento">Fecha del recordatorio</Label>
                        <Input
                            id="fecha_mantenimiento"
                            type="date"
                            min={today}
                            value={data.fecha_mantenimiento}
                            onChange={(e) => setData('fecha_mantenimiento', e.target.value)}
                            required
                        />
                        <InputError message={errors.fecha_mantenimiento} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="detalle">Descripcion</Label>
                        <Input
                            id="detalle"
                            value={data.detalle}
                            onChange={(e) => setData('detalle', e.target.value)}
                            autoComplete='off'
                            placeholder="Ej. Revisar ventiladores y limpieza general"
                        />
                        <InputError message={errors.detalle} />
                    </div>

                    <DialogFooter>
                        <Button className="cursor-pointer" type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button className="cursor-pointer" type="submit" disabled={processing}>
                            {processing && <Spinner />}
                            Programar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}