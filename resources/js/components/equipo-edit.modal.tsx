import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { EquipoForm } from '@/components/equipo-form';
import type { EquipoFormData, Encargado } from '@/components/equipo-form';

interface EditData {
    equipo: Partial<EquipoFormData> & { id: number };
    tiposLabels: Record<string, string>;
    ubicaciones: Array<{ value: string, label: string }>;
    sedes: Array<{ value: string, label: string, region: string }>;
    pisos: Array<{ value: string, label: string }>;
    condiciones: Array<{ value: string; label: string }>
    encargados: Encargado[];
}

interface Props {
    equipoId: number | null;
    isOpen: boolean;
    onClose: () => void;
}

export function EquipoEditModal({ equipoId, isOpen, onClose }: Props) {
    const [data, setData] = useState<EditData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !equipoId) {
            return;
        }

        setLoading(true);
        setError(null);
        setData(null);

        fetch(`/equipos/${equipoId}/edit-data`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })
            .then((res) => {
                if (!res.ok) throw new Error('No se pudo cargar la información del equipo.');
                return res.json();
            })
            .then((json: EditData) => setData(json))
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, [isOpen, equipoId]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto [&>button]:cursor-pointer">
                <DialogHeader>
                    <DialogTitle className="flex justify-center">Editar Equipo</DialogTitle>
                    <DialogDescription className="flex justify-center">
                        Modifica los datos del equipo seleccionado.
                    </DialogDescription>
                </DialogHeader>

                {loading && (
                    <div className="flex justify-center py-10">
                        <Spinner className="h-6 w-6" />
                    </div>
                )}

                {error && <p className="text-sm text-destructive py-4">{error}</p>}

                {data && !loading && (
                    <EquipoForm
                        mode="edit"
                        equipoId={data.equipo.id}
                        tiposLabels={data.tiposLabels}
                        ubicaciones={data.ubicaciones}
                        sedesOptions={data.sedes}
                        pisosOptions={data.pisos}
                        condiciones={data.condiciones}
                        encargados={data.encargados}
                        initialData={data.equipo}
                        onSuccess={onClose}
                        onCancel={onClose}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}