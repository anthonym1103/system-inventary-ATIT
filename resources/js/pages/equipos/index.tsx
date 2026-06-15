import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Eye, Pencil, Trash2, Plus } from 'lucide-react';

interface Equipo {
    id: number;
    area: string;
    tipo: string;
    condicion: 'Operativo' | 'No operativo';
    marca: string | null;
    modelo: string;
    serial: string;
    detalle: string | null;
    created_at: string;
    updated_at: string;
    ubicacion: {
        id: number;
        estado: string;
        locacion: string;
    };
}

interface Ubicacion {
    id: number;
    estado: string;
    locacion: string;
}

interface Filters {
    search: string;
    condicion: string;
    ubicacion_id: string;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    equipos: PaginatedData<Equipo>;
    filters: Filters;
    canCreate: boolean;
    ubicaciones: Ubicacion[];
    tiposLabels: Record<string, string>;
}

export default function Index({ equipos, filters, canCreate, ubicaciones, tiposLabels }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [condicion, setCondicion] = useState(filters.condicion || '');
    const [ubicacionId, setUbicacionId] = useState(filters.ubicacion_id || '');

    const applyFilters = () => {
        router.get('/equipos', { search, condicion, ubicacion_id: ubicacionId }, { preserveState: true, preserveScroll: true });
    };

    const clearFilters = () => {
        setSearch('');
        setCondicion('');
        setUbicacionId('');
        router.get('/equipos', {}, { preserveState: true });
    };

    return (
        <>
            <Head title="Inventario de Equipos" />
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Inventario de Equipos</h1>
                    {canCreate && (
                        <Link href="/equipos/create">
                            <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Equipo</Button>
                        </Link>
                    )}
                </div>

                {/* Filtros igual que antes */}

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Marca</TableHead>
                                <TableHead>Modelo</TableHead>
                                <TableHead>Serial</TableHead>
                                <TableHead>Condición</TableHead>
                                <TableHead>Ubicación</TableHead>
                                <TableHead>Área</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {equipos.data.map((equipo) => (
                                <TableRow key={equipo.id}>
                                    <TableCell>{tiposLabels[equipo.tipo] || equipo.tipo}</TableCell>
                                    <TableCell>{equipo.marca || '-'}</TableCell>
                                    <TableCell>{equipo.modelo}</TableCell>
                                    <TableCell>{equipo.serial}</TableCell>
                                    <TableCell>
                                        <Badge variant={equipo.condicion === 'Operativo' ? 'default' : 'destructive'}>
                                            {equipo.condicion}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{equipo.ubicacion?.locacion}, {equipo.ubicacion?.estado}</TableCell>
                                    <TableCell>{equipo.area}</TableCell>
                                    <TableCell>
                                        <Link href={`/equipos/${equipo.id}`}>
                                            <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Paginación */}
            </div>
        </>
    );
}