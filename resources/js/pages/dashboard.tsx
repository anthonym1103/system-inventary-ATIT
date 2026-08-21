import { Head, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { dashboard } from '@/routes';
import equipos from '@/routes/equipos';

// Definir tipos (puedes moverlos a types/)
interface Equipo {
    id: number;
    tipo: string;
    marca: string;
    modelo: string;
    serial: string;
    condicion: 'operativo' | 'no_operativo';
    area: string;
    ubicacion: { estado: string; sede: string; piso: string; };
    created_at: string;
}

interface Props {
    totalesPorArea: Record<string, number>;
    condiciones: { operativo: number; no_operativo: number };
    ultimosEquipos: Equipo[];
    estadosLabels: Record<string, string>;
    condicionesLabels: Record<string, string>;
    equiposPorUbicacion: Array<{
        id: number;
        estado: string;
        sede: string;
        piso: string;
        equipos_count: number;
        porcentaje: number;
    }>;
    sedesLabels: Record<string, string>;
    pisosLabels: Record<string, string>;
}

export default function Dashboard({ totalesPorArea, condiciones, ultimosEquipos, estadosLabels, condicionesLabels, equiposPorUbicacion, sedesLabels, pisosLabels }: Props) {
    // Función para mostrar el área en español
    const areaLabel = (area: string) => {
        const map: Record<string, string> = {
            infraestructura: 'Infraestructura',
            redes: 'Redes y Telefonia',
            transmision_datos: 'Transmisión de Datos'
        };
        return map[area] || area;
    };
    const { auth } = usePage().props;
    const { tiposLabels } = usePage().props as any;

    return (
        <>
            <Head title="Inicio" />
            <div className="p-6 space-y-6">
                <h1 className="text-2xl font-bold">Resumen de Inventario</h1>
                
                {/* Tarjetas de totales por área */}
                {auth.role === 'administrador' &&
                    (<div className="grid gap-4 md:grid-cols-3">
                        {Object.entries(totalesPorArea).map(([area, total]) => (
                            <Card key={area} className='gap-1'>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {areaLabel(area)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{total}</div>
                                    <p className="text-xs text-muted-foreground">Equipos registrados</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>)
                }

                {/* Tarjetas de condición */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Equipos Operativos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-700">{condiciones.operativo}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Equipos No Operativos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-red-600">{condiciones.no_operativo}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Últimos equipos agregados */}
                <Card>
                    <CardHeader>
                        <CardTitle>Últimos equipos registrados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Marca</TableHead>
                                    <TableHead>Modelo</TableHead>
                                    <TableHead>Serial</TableHead>
                                    <TableHead>Condición</TableHead>
                                    <TableHead>Ubicación</TableHead>
                                    <TableHead>Fecha</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ultimosEquipos.map((equipo) => (
                                    <TableRow key={equipo.id}>
                                        <TableCell className="font-medium">{tiposLabels[equipo.tipo] || equipo.tipo}</TableCell>
                                        <TableCell>{equipo.marca} </TableCell>
                                        <TableCell>{equipo.modelo} </TableCell>
                                        <TableCell>{equipo.serial}</TableCell>
                                        <TableCell>
                                            <Badge variant={equipo.condicion === 'operativo' ? 'operativo' : 'no_operativo'}>
                                                {condicionesLabels[equipo.condicion]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{sedesLabels[equipo.ubicacion?.sede]} — {pisosLabels[equipo.ubicacion?.piso]}, {estadosLabels[equipo.ubicacion?.estado]}</TableCell>
                                        <TableCell>{new Date(equipo.created_at).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                                {ultimosEquipos.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center">No hay equipos registrados</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Top ubicaciones */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ubicaciones con más equipos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {equiposPorUbicacion.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No hay datos de ubicación disponibles.</p>
                        ) : (
                            equiposPorUbicacion.map((ubic) => (
                                <div key={ubic.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">
                                            {sedesLabels[ubic.sede] ?? 'Sin sede'} — {pisosLabels[ubic.piso] ?? 'Sin piso'}
                                            <span className="ml-1 text-muted-foreground">
                                                ({estadosLabels[ubic.estado]})
                                            </span>
                                        </span>
                                        <span className="text-muted-foreground">
                                            {ubic.equipos_count} equipo{ubic.equipos_count !== 1 ? 's' : ''} · {ubic.porcentaje}%
                                        </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all"
                                            style={{ width: `${ubic.porcentaje}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};