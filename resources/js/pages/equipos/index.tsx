import { Head, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Debounce manual
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// Tipos (igual que antes)
interface Equipo {
    id: number;
    tipo: string;
    marca: string;
    modelo: string;
    serial: string;
    condicion: 'Operativo' | 'No operativo';
    area: string;
    ubicacion: { id: number; estado: string; locacion: string };
    userAsignado?: { cedula: string; nombre: string; apellido: string } | null;
    created_at: string;
}

interface Props {
    equipos: {
        data: Equipo[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    tiposLabels: Record<string, string>;
    condiciones: Array<{ value: string, label: string }>
    ubicaciones: Array<{ id: number; estado: string; locacion: string }>;
    filters: {
        search: string;
        tipo: string;
        condicion: string;
        ubicacion_id: string;
    };
    permissions: {
        can_create: boolean;
        can_edit: boolean;
        can_delete: boolean;
    };
}

export default function EquiposIndex({ equipos, tiposLabels, condiciones, ubicaciones, filters, permissions }: Props) {
    // Inicializar con undefined en lugar de '' para evitar el valor vacío
    const [search, setSearch] = useState(filters.search || '');
    const [tipo, setTipo] = useState<string | undefined>(filters.tipo || undefined);
    const [condicion, setCondicion] = useState<string | undefined>(filters.condicion || undefined);
    const [ubicacionId, setUbicacionId] = useState<string | undefined>(filters.ubicacion_id || undefined);

    const debouncedSearch = useDebounce(search, 300);

    // Aplicar filtros cuando cambien
    useEffect(() => {
        const params: Record<string, string> = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (tipo) params.tipo = tipo;
        if (condicion) params.condicion = condicion;
        if (ubicacionId) params.ubicacion_id = ubicacionId;

        router.get('/equipos', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [debouncedSearch, tipo, condicion, ubicacionId]);

    const clearFilters = () => {
        setSearch('');
        setTipo(undefined);
        setCondicion(undefined);
        setUbicacionId(undefined);
        router.get('/equipos', {}, { preserveState: true });
    };

    const handlePageChange = (url: string | null) => {
        if (url) router.get(url, {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <>
            <Head title="Inventario" />
            <div className="p-6 space-y-6">
                {/* Cabecera con botón Nuevo */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-2xl font-bold">Inventario de Equipos</h1>
                    {permissions.can_create && (
                        <Button asChild>
                            <Link href="/equipos/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Equipo
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Filtros */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Búsqueda */}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por serial, marca, modelo..."
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            {/* Tipo */}
                            <div>
                                <Select
                                    value={tipo}
                                    onValueChange={(val) => setTipo(val || undefined)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos los tipos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(tiposLabels).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Condición */}
                            <div>
                                <Select
                                    value={condicion}
                                    onValueChange={(val) => setCondicion(val || undefined)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todas las condiciones" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/*condiciones.map((c) => (
                                            <pre className="bg-gray-100 p-4 text-xs">
                                                {JSON.stringify(c, null, 2)}
                                            </pre>
                                        ))*/}
                                        {condiciones.map((c) => (
                                            <SelectItem key={c.value} value={c.value}>
                                                {c.value === 'Operativo' ? 'Operativo' : 'No operativo'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Ubicación */}
                            <div>
                                <Select
                                    value={ubicacionId}
                                    onValueChange={(val) => setUbicacionId(val || undefined)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todas las ubicaciones" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ubicaciones.map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {u.locacion}, {u.estado}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end mt-2">
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                Limpiar filtros
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla */}
                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Marca</TableHead>
                                    <TableHead>Modelo</TableHead>
                                    <TableHead>Serial</TableHead>
                                    <TableHead>Condición</TableHead>
                                    <TableHead>Ubicación</TableHead>
                                    <TableHead>Asignado a</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {equipos.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                                            No se encontraron equipos
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    equipos.data.map((equipo) => (
                                        <TableRow key={equipo.id}>
                                            <TableCell className="font-medium">
                                                {tiposLabels[equipo.tipo] || equipo.tipo}
                                            </TableCell>
                                            <TableCell>{equipo.marca}</TableCell>
                                            <TableCell>{equipo.modelo}</TableCell>
                                            <TableCell className="font-mono text-xs">{equipo.serial}</TableCell>
                                            <TableCell>
                                                <Badge variant={equipo.condicion === 'Operativo' ? 'operativo' : 'no_operativo'}>
                                                    {equipo.condicion}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {equipo.ubicacion?.locacion}, {equipo.ubicacion?.estado}
                                            </TableCell>
                                            <TableCell>
                                                {equipo.userAsignado
                                                    ? `${equipo.userAsignado.nombre} ${equipo.userAsignado.apellido}`
                                                    : 'No asignado'}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                {permissions.can_edit && (
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/equipos/${equipo.id}/edit`}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                )}
                                                {permissions.can_delete && (
                                                    <Button variant="destructive" size="sm" asChild>
                                                        <Link
                                                            href={`/equipos/${equipo.id}`}
                                                            method="delete"
                                                            as="button"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Paginación */}
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                                Mostrando {equipos.data.length} de {equipos.total} equipos
                            </div>
                            <div className="flex gap-1">
                                {equipos.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => handlePageChange(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

// Breadcrumbs
EquiposIndex.layout = {
    breadcrumbs: [
        {
            title: 'Inventario',
            href: '/equipos',
        },
    ],
};