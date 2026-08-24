import { useEffect, useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { MapPin, User, Calendar, Phone, IdCard, Building2, FileDigit } from 'lucide-react';

interface EquipoDetailModalProps {
    equipoId: number | null;
    isOpen: boolean;
    onClose: () => void;
    tiposLabels: Record<string, string>;
    estadosLabels: Record<string, string>;
    sedesLabels: Record<string, string>;
    pisosLabels: Record<string, string>;
    condidicionesLabels: Record<string, string>;
}

export function EquipoDetailModal({ equipoId, isOpen, onClose, tiposLabels, estadosLabels,sedesLabels, pisosLabels, condidicionesLabels }: EquipoDetailModalProps) {
    const [equipo, setEquipo] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !equipoId) return;

        setLoading(true);
        setError(null);
        setEquipo(null);

        fetch(`/equipos/${equipoId}`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })
            .then((res) => {
                if (!res.ok) throw new Error('No se pudo cargar la información del equipo.');
                return res.json();
            })
            .then(setEquipo)
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, [isOpen, equipoId]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto [&>button]:cursor-pointer">
                
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {equipo ? (equipo.tipo_label || tiposLabels[equipo.tipo] || equipo.tipo) : 'Detalle del equipo'}
                        {equipo && !loading && (
                            <Badge variant={equipo.condicion === 'operativo' ? 'operativo' : 'no_operativo'} className="w-fit">
                                {condidicionesLabels[equipo.condicion]}
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {equipo 
                            ? `Marca: ${equipo.marca ?? '—'} • Modelo: ${equipo.modelo} • Serial: ${equipo.serial}`
                            : 'Cargando información del equipo...'
                        }
                    </DialogDescription>
                </DialogHeader>

                {loading && (
                    <div className="flex justify-center py-10">
                        <Spinner className="h-6 w-6" />
                    </div>
                )}

                {error && <p className="text-sm text-destructive py-4">{error}</p>}

                {equipo && !loading && (
                    <>
                    
                        <Separator />

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="col-span-2">
                                <h4 className="font-medium mb-2 text-xs uppercase text-muted-foreground">Información General</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>
                                            {equipo.ubicacion?.sede_label ?? sedesLabels[equipo.ubicacion?.sede] ?? equipo.ubicacion?.sede}
                                            {' - '}
                                            {equipo.ubicacion?.piso_label ?? pisosLabels[equipo.ubicacion?.piso] ?? equipo.ubicacion?.piso}
                                            {', '}
                                            {equipo.ubicacion?.estado_label ?? estadosLabels[equipo.ubicacion?.estado] ?? equipo.ubicacion?.estado}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>Registrado: {new Date(equipo.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FileDigit className="h-4 w-4 text-muted-foreground" />
                                        <span>{equipo.numero_inventario ?? 'S/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {equipo.user_asignado && (
                                <>
                                    <Separator className="col-span-2" />
                                    <div className="col-span-2">
                                        <h4 className="font-medium mb-2 text-xs uppercase text-muted-foreground">Equipo Asignado a:</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span>{`${equipo.user_asignado.nombre} ${equipo.user_asignado.apellido}`}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <IdCard className="h-4 w-4 text-muted-foreground" />
                                                <span>{equipo.user_asignado.cedula}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span>{equipo.user_asignado.telefono || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <span>{equipo.user_asignado.gerencia || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/*
                                Antes esta sección se armaba dinámicamente a partir de
                                equipo.infraestructura / equipo.rede / equipo.transmision.
                                Esas tablas ya no existen: ahora todo lo técnico vive en
                                un solo campo de texto libre (equipo.caracteristicas),
                                así que solo lo mostramos tal cual el usuario lo escribió.
                            */}
                            {equipo.caracteristicas && (
                                <>
                                    <Separator className="col-span-2" />
                                    <div className="col-span-2">
                                        <h4 className="font-medium mb-2 text-xs uppercase text-muted-foreground">
                                            Características Técnicas
                                        </h4>
                                        <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                                            {equipo.caracteristicas}
                                        </p>
                                    </div>
                                </>
                            )}

                            {equipo.detalle && (
                                <>
                                    <Separator className="col-span-2" />
                                    <div className="col-span-2">
                                        <h4 className="font-medium mb-2 text-xs uppercase text-muted-foreground">Observaciones</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{equipo.detalle}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}