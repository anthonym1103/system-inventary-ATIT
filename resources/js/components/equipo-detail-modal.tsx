import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, User, Calendar, Package, Hash, Tag } from 'lucide-react';

interface EquipoDetailModalProps {
  equipo: any | null;
  isOpen: boolean;
  onClose: () => void;
  tiposLabels: Record<string, string>;
}

export function EquipoDetailModal({ equipo, isOpen, onClose, tiposLabels }: EquipoDetailModalProps) {
  if (!equipo) return null;

  const getDetallesEspecificos = () => {
    // Aquí puedes agregar más detalles según el área
    // Por ahora mostramos un placeholder, luego puedes extenderlo
    const detalles: Array<{ label: string; value: string | null }> = [];

    // Ejemplo: si tienes relación con infraestructura, redes o transmisión
    if (equipo.infraestructura) {
      detalles.push(
        { label: 'RAM', value: equipo.infraestructura.ram },
        { label: 'Disco', value: equipo.infraestructura.disco },
        { label: 'Sistema Operativo', value: equipo.infraestructura.sistema_operativo },
        { label: 'MAC', value: equipo.infraestructura.direccion_mac },
        { label: 'Inventario', value: equipo.infraestructura.numero_inventario },
        { label: 'Dominio', value: equipo.infraestructura.dominio },
      );
    }

    if (equipo.rede) {
      detalles.push(
        { label: 'IP', value: equipo.rede.direccion_ip },
        { label: 'MAC', value: equipo.rede.direccion_mac },
        { label: 'Puerto', value: equipo.rede.puerto },
        { label: 'Puerto Fibra', value: equipo.rede.puerto_fibra },
        { label: 'Extensión', value: equipo.rede.extension },
      );
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
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {tiposLabels[equipo.tipo] || equipo.tipo}
            <Badge variant={equipo.condicion === 'Operativo' ? 'operativo' : 'no_operativo'} className="w-fit">
              {equipo.condicion}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {equipo.marca} {equipo.modelo} • Serial: {equipo.serial}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* Información general */}
          <div className="col-span-2">
            <h4 className="font-medium mb-2 text-xs uppercase text-muted-foreground">Información General</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span>Área: <span className="font-mono">{equipo.area}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Registrado: {new Date(equipo.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{equipo.ubicacion?.locacion}, {equipo.ubicacion?.estado}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{equipo.userAsignado ? `${equipo.userAsignado.nombre} ${equipo.userAsignado.apellido}` : 'No asignado'}</span>
              </div>
            </div>
          </div>

          {detalles.length > 0 && (
            <>
              <Separator className="col-span-2" />
              <div className="col-span-2">
                <h4 className="font-medium mb-2 text-xs uppercase text-muted-foreground">Características Técnicas</h4>
                <div className="grid grid-cols-2 gap-2">
                  {detalles.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium text-foreground">{d.label}:</span>
                      <span>{d.value || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Detalle adicional si está disponible */}
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
      </DialogContent>
    </Dialog>
  );
}