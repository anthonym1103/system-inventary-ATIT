// resources/js/components/equipo-desincorporar-dialog.tsx
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (motivo: string) => void;
    count: number;
    processing?: boolean;
}

export function EquipoDesincorporarDialog({ isOpen, onClose, onConfirm, count, processing = false }: Props) {
    const [motivo, setMotivo] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setMotivo('');
            setError(null);
            onClose();
        }
    };

    const handleConfirm = () => {
        if (!motivo.trim()) {
            setError('Debe indicar el motivo de la desincorporación.');
            return;
        }
        onConfirm(motivo.trim());
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="flex items-center">
                    <DialogTitle>Motivo de la desincorporación</DialogTitle>
                    <DialogDescription>
                        Vas a desincorporar {count} equipo(s).
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-2">
                    <Label htmlFor="motivo" className="w-full select-text cursor-text">Explicación breve del motivo</Label>
                    <textarea
                        id="motivo"
                        className="border-input flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        value={motivo}
                        onChange={(e) => {
                            setMotivo(e.target.value);
                            if (error) setError(null);
                        }}
                        placeholder="Ej. Equipos obsoletos, dañados, fuera de uso..."
                    />
                    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                </div>

                <DialogFooter>
                    <Button type="button" className="cursor-pointer" variant="outline" onClick={() => handleOpenChange(false)} disabled={processing}>
                        Cancelar
                    </Button>
                    <Button type="button" className="cursor-pointer" variant="destructiveNotification" onClick={handleConfirm} disabled={processing}>
                        {processing && <Spinner />}
                        Generar y desincorporar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}