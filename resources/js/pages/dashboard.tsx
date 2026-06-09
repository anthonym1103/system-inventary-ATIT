import { Head, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { dashboard } from '@/routes';

// Definir tipos (puedes moverlos a types/)
interface Equipo {
    id: number;
    tipo: string;
    marca: string;
    modelo: string;
    serial: string;
    condicion: 'Operativo' | 'No operativo';
    area: string;
    ubicacion: { estado: string; locacion: string };
    created_at: string;
}

interface Props {
    totalesPorArea: Record<string, number>;
    condiciones: { Operativo: number; 'No operativo': number };
    ultimosEquipos: Equipo[];
    equiposPorUbicacion: Array<{ id: number; estado: string; locacion: string; equipos_count: number }>;
}

export default function Dashboard({ totalesPorArea, condiciones, ultimosEquipos, equiposPorUbicacion }: Props) {
    // Función para mostrar el área en español
    const areaLabel = (area: string) => {
        const map: Record<string, string> = {
            infraestructura: 'Infraestructura',
            redes: 'Redes',
            transmision_datos: 'Transmisión'
        };
        return map[area] || area;
    };

    const { tiposLabels } = usePage().props as any;

    return (
        <>
            <Head title="Dashboard" />
            <div className="p-6 space-y-6">
                <h1 className="text-2xl font-bold">Dashboard de Inventario</h1>
                
                {/* Tarjetas de totales por área */}
                <div className="grid gap-4 md:grid-cols-3">
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
                </div>

                {/* Tarjetas de condición */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Equipos Operativos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">{condiciones.Operativo}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Equipos No Operativos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-red-600">{condiciones['No operativo']}</div>
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
                                    <TableHead>Marca/Modelo</TableHead>
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
                                        <TableCell>{equipo.marca} {equipo.modelo}</TableCell>
                                        <TableCell>{equipo.serial}</TableCell>
                                        <TableCell>
                                            <Badge variant={equipo.condicion === 'Operativo' ? 'default' : 'destructive'}>
                                                {equipo.condicion}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{equipo.ubicacion?.locacion}, {equipo.ubicacion?.estado}</TableCell>
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
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ubicación</TableHead>
                                    <TableHead>Cantidad de equipos</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {equiposPorUbicacion.map((ubic) => (
                                    <TableRow key={ubic.id}>
                                        <TableCell>{ubic.locacion}, {ubic.estado}</TableCell>
                                        <TableCell>{ubic.equipos_count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
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