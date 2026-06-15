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
    const { auth } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [condicion, setCondicion] = useState(filters.condicion || '');
    const [ubicacionId, setUbicacionId] = useState(filters.ubicacion_id || '');

    const applyFilters = () => {
        router.get('/equipos', { search, condicion, ubicacion_id: ubicacionId }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setCondicion('');
        setUbicacionId('');
        router.get('/equipos', {}, { preserveState: true });
    };

    const deleteEquipo = (id: number, nombre: string) => {
        if (confirm(`¿Eliminar el equipo "${nombre}"? Esta acción no se puede deshacer.`)) {
            router.delete(`/equipos/${id}`);
        }
    };

    // Verificar si el usuario puede modificar equipos de un área específica
    const canManageArea = (area: string) => {
        /*if (auth.user?.hasRole?.('Administrador')) return true;
        // Verifica permisos según el área
        const permiso = `area_${area}`;
        return auth.user?.hasPermissionTo?.(permiso) ?? false;*/
    };

    return (
        <>
            <Head title="Inventario de Equipos" />
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Inventario de Equipos</h1>
                    {canCreate && (
                        <Link href="/equipos/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Equipo
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <Input
                            placeholder="Buscar por marca, modelo, serial..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                    </div>
                    <div className="w-48">
                        <Select value={condicion} onValueChange={setCondicion}>
                            <SelectTrigger>
                                <SelectValue placeholder="Condición" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Todas</SelectItem>
                                <SelectItem value="Operativo">Operativo</SelectItem>
                                <SelectItem value="No operativo">No operativo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-64">
                        <Select value={ubicacionId} onValueChange={setUbicacionId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Ubicación" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Todas</SelectItem>
                                {ubicaciones.map((ubic) => (
                                    <SelectItem key={ubic.id} value={String(ubic.id)}>
                                        {ubic.locacion}, {ubic.estado}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={applyFilters} variant="default">
                        <Search className="mr-2 h-4 w-4" />
                        Filtrar
                    </Button>
                    <Button onClick={clearFilters} variant="outline">
                        Limpiar
                    </Button>
                </div>

                {/* Tabla */}
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
                            {equipos.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center">
                                        No se encontraron equipos.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                equipos.data.map((equipo) => (
                                    <TableRow key={equipo.id}>
                                        <TableCell>
                                            {tiposLabels[equipo.tipo] || equipo.tipo}
                                        </TableCell>
                                        <TableCell>{equipo.marca || '-'}</TableCell>
                                        <TableCell>{equipo.modelo}</TableCell>
                                        <TableCell>{equipo.serial}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={equipo.condicion === 'Operativo' ? 'default' : 'destructive'}
                                            >
                                                {equipo.condicion}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {equipo.ubicacion?.locacion}, {equipo.ubicacion?.estado}
                                        </TableCell>
                                        <TableCell>{equipo.area}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Link href={`/equipos/${equipo.id}`}>
                                                    <Button size="sm" variant="ghost" title="Ver">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                {/*canManageArea(equipo.area) && (
                                                    <>
                                                        <Link href={`/equipos/${equipo.id}/edit`}>
                                                            <Button size="sm" variant="ghost" title="Editar">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            title="Eliminar"
                                                            onClick={() => deleteEquipo(equipo.id, `${equipo.modelo} (${equipo.serial})`)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )*/}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Paginación */}
                {equipos.last_page > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        {equipos.links.map((link, idx) => (
                            <Button
                                key={idx}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    if (link.url) router.get(link.url);
                                }}
                                disabled={!link.url}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}