import { useEffect, useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { MapPin, User, Calendar, Phone, IdCard, Building2 } from 'lucide-react';

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

    const getDetallesEspecificos = () => {
        if (!equipo) return [];
        const detalles: Array<{ label: string; value: string | null }> = [];

        if (equipo.infraestructura) {
            detalles.push(
                { label: 'Año', value: equipo.infraestructura.anio },
                { label: 'RAM', value: equipo.infraestructura.ram },
                { label: 'Disco', value: equipo.infraestructura.disco },
                { label: 'Sistema Operativo', value: equipo.infraestructura.sistema_operativo },
                { label: 'MAC', value: equipo.infraestructura.direccion_mac },
                { label: 'Numero Inventario', value: equipo.infraestructura.numero_inventario },
                { label: 'Dominio', value: equipo.infraestructura.dominio },
            );
        }

        if (equipo.rede) {
            detalles.push(
                { label: 'IP', value: equipo.rede.direccion_ip },
                { label: 'MAC', value: equipo.rede.direccion_mac },
                { label: 'Puerto', value: equipo.rede.puerto },
                { label: 'Puerto Fibra', value: equipo.rede.puerto_fibra },
                { label: 'Extensión', value: equipo.rede.extension},
                { label: 'Ubicacion Puerto', value: equipo.rede.ubicacion_puerto },
            );
            if (equipo.rede.contraseña_bios) {
                detalles.push({ label: 'Contraseña BIOS', value: equipo.rede.contraseña_bios });
            }
        }

        if (equipo.transmision) {
            detalles.push(
                { label: 'Potencia', value: equipo.transmision.potencia },
                { label: 'Frecuencia', value: equipo.transmision.rango_frecuencia },
                { label: 'Inventario', value: equipo.transmision.numero_inventario },
                { label: 'Características', value: equipo.transmision.caracteristicas },
            );
        }

        return detalles;
    };

    const detalles = getDetallesEspecificos();

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto [&>button]:cursor-pointer">
                
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {equipo? (tiposLabels[equipo.tipo] || equipo.tipo) : 'Detalle del equipo' }
                        {equipo && !loading && (
                            <Badge variant={equipo.condicion === 'operativo' ? 'operativo' : 'no_operativo'} className="w-fit">
                                {condidicionesLabels[equipo.condicion]}
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {equipo 
                            ? `Marca: ${equipo.marca} • Modelo: ${equipo.modelo} • Serial: ${equipo.serial}`
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
                                        <span>{sedesLabels[equipo.ubicacion?.sede]} - {pisosLabels[equipo.ubicacion?.piso]}, {estadosLabels[equipo.ubicacion?.estado]}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>Registrado: {new Date(equipo.created_at).toLocaleDateString()}</span>
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

                            {detalles.length > 0 && (
                                <>
                                    <Separator className="col-span-2" />
                                    <div className="col-span-2">
                                        <h4 className="font-medium mb-2 text-xs uppercase text-muted-foreground">Características Técnicas</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {detalles.map((d, i) => d.value && (
                                                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                                                    <span className="font-medium text-foreground">{d.label}:</span>
                                                    <span>{d.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {equipo.detalle && (
                                <>
                                    <Separator className="col-span-2" />
                                    <div className="col-span-2">
                                        <h4 className="font-medium mb-2 text-xs uppercase text-muted-foreground">Observaciones</h4>
                                        <p className="text-sm text-muted-foreground">{equipo.detalle}</p>
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