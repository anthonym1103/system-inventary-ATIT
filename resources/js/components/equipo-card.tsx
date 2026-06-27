import { Link } from '@inertiajs/react';
import { Pencil, Trash2, User, MapPin } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { equipoIconMap, equipoColorMap } from '@/lib/equipo-icons';

interface EquipoCardProps {
  equipo: {
    id: number;
    tipo: string;
    marca: string;
    modelo: string;
    serial: string;
    condicion: 'Operativo' | 'No operativo';
    area: string;
    ubicacion: { id: number; estado: string; locacion: string };
    userAsignado?: { cedula: string; nombre: string; apellido: string } | null;
  };
  tiposLabels: Record<string, string>;
  permissions: {
    can_edit: boolean;
    can_delete: boolean;
  };
  onCardClick: (equipo: any) => void;
}

export function EquipoCard({ equipo, tiposLabels, permissions, onCardClick }: EquipoCardProps) {
  const Icon = equipoIconMap[equipo.tipo] || equipoIconMap.micro_escritorio;
  const colorClass = equipoColorMap[equipo.tipo] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300';

  const handleCardClick = (e: React.MouseEvent) => {
    // Evitar que el click en los botones de acción dispare el modal
    if ((e.target as HTMLElement).closest('button')) return;
    onCardClick(equipo);
  };

  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-3 ${colorClass}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">
                {tiposLabels[equipo.tipo] || equipo.tipo}
              </h3>
              <p className="text-xs text-muted-foreground">{equipo.marca} {equipo.modelo}</p>
            </div>
          </div>
          <Badge variant={equipo.condicion === 'Operativo' ? 'operativo' : 'no_operativo'} className="w-fit">
            {equipo.condicion}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-2 space-y-2">
        <div className="flex items-center text-sm text-muted-foreground gap-2">
          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{equipo.serial}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground gap-1">
          <MapPin className="h-3.5 w-3.5" />
          <span>{equipo.ubicacion?.locacion}, {equipo.ubicacion?.estado}</span>
        </div>
        {equipo.userAsignado && (
          <div className="flex items-center text-sm text-muted-foreground gap-1">
            <User className="h-3.5 w-3.5" />
            <span>{equipo.userAsignado.nombre} {equipo.userAsignado.apellido}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 flex justify-end gap-2 border-t">
        {permissions.can_edit && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/equipos/${equipo.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Link>
          </Button>
        )}
        {/*permissions.can_delete && (
          <Button variant="destructive" size="sm" asChild>
            <Link href={`/equipos/${equipo.id}`} method="delete" as="button">
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </Link>
          </Button>
        )*/}
      </CardFooter>
    </Card>
  );
}