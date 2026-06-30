import { Head, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Search, Plus, Grid2X2, LayoutList, FileX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EquipoCard } from '@/components/equipo-card';
import { EquipoDetailModal } from '@/components/equipo-detail-modal';
import { EquipoEditModal } from '@/components/equipo-edit.modal';
import { SelectItemText, Value } from '@radix-ui/react-select';
import { Separator } from '@/components/ui/separator';
import { EquipoMantenimientoDialog } from '@/components/equipo-mantenimiento-dialog';


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
    estadosLabels: Record<string, string>;
    condiciones: Array<{ value: string, label: string }>
    ubicaciones: Array<{ value: string, label: string }>;
    filters: {
        search: string;
        tipo: string;
        condicion: string;
        estado_region: string;
    };
    permissions: {
        can_create: boolean;
        can_edit: boolean;
        can_delete: boolean;
        can_viewHistorial: boolean;
    };
}

export default function EquiposIndex({ equipos, tiposLabels, estadosLabels, condiciones, ubicaciones, filters, permissions }: Props) {
    // Inicializar con undefined en lugar de '' para evitar el valor vacío
    const [search, setSearch] = useState(filters.search || '');
    const [tipo, setTipo] = useState<string | undefined>(filters.tipo || undefined);
    const [condicion, setCondicion] = useState<string | undefined>(filters.condicion || undefined);
    const [region, setRegion] = useState<string | undefined>(filters.estado_region || undefined);
    const [selectedEquipo, setSelectedEquipo] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editEquipoId, setEditEquipoId] = useState<number | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [classNameViewMode, setClassNameViewMode] = useState<string>('flex flex-col gap-4');
    const [scheduleEquipo, setScheduleEquipo] = useState<any>(null);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const debouncedSearch = useDebounce(search, 300);

    
    // Aplicar filtros cuando cambien

    
    useEffect(() => {
        const params: Record<string, string> = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (tipo) params.tipo = tipo;
        if (condicion) params.condicion = condicion;
        if (region) params.estado_region = region;
        
        router.get('/equipos', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [debouncedSearch, tipo, condicion, region]);

    const clearFilters = () => {
        setSearch('');
        setTipo(undefined);
        setCondicion(undefined);
        setRegion(undefined);
        router.get('/equipos', {}, { preserveState: false });
    };

    const handlePageChange = (url: string | null) => {
        if (url) router.get(url, {}, { preserveState: true, preserveScroll: false });
    };

    const handleCardClick = (equipo: any) => {
        // Cargar detalles completos del equipo (con relaciones) si no están cargados
        // En tu caso, podrías hacer una llamada a /equipos/{id} con ?with=infraestructura,rede,transmision
        // O pasar los datos completos desde el controlador
        setSelectedEquipo(equipo);
        setModalOpen(true);
    };

    const handleClassNameViewMode = (mode: 'grid' | 'list') => {
        setClassNameViewMode(mode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'flex flex-col gap-4');
        setViewMode(mode);
    };

    const handleEditClick = (equipo: any) => {
        setEditEquipoId(equipo.id);
        setEditModalOpen(true);
    };

    const handleScheduleClick = (equipo: any) => {
        setScheduleEquipo(equipo);
        setScheduleModalOpen(true);
    };

    return (
        <>
            <Head title="Inventario" />
            <div className="p-6 space-y-6">
                {/* Cabecera con botón Nuevo */}
                <div className='flex justify-end mb-1 mr-4'>
                    <h3 className="font-medium text-xs uppercase text-muted-foreground">Vistas:</h3>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/*<h1 className="text-2xl font-bold">Inventario de Equipos</h1>*/}
                    {/* Búsqueda */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por serial, marca, modelo..."
                            className="pl-8 w-72 sm:w-80"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end items-center gap-2">
                        {permissions.can_create && (
                            <div className='flex gap-2'>
                                <Button variant="outline" asChild>
                                    <Link href="/equipos/create">
                                        <Plus className="h-4 w-4" />
                                        Agregar nuevo equipo
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href="">
                                        <FileX className="h-3.5 w-3.5" />
                                        Desincorporar equipos
                                    </Link>
                                </Button>
                            </div>
                        )}
                        {/*<h3 className="font-medium text-xs uppercase text-muted-foreground">Vistas:</h3>*/}
                        <div className="flex border rounded-md overflow-hidden">
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'ghost'}
                                size="sm"
                                className="rounded-none cursor-pointer" 
                                onClick={() => handleClassNameViewMode('list')}
                            >
                                <LayoutList className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                size="sm"
                                className="rounded-none cursor-pointer"
                                onClick={() => handleClassNameViewMode('grid')}
                            >
                                <Grid2X2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/**Filtros de busqueda */}

                <Separator className="col-span-2" />
                <h3 className="font-medium mb-2 text-xs uppercase text-muted-foreground">Filtros</h3>

                <div className="flex flex-col sm:flex-row gap-4 mt-6 mb-10">
                    {/* Tipo */}
                    <div>
                        <Select
                            value={tipo}
                            onValueChange={(val) => setTipo(val || undefined)}
                        >
                            <SelectTrigger className="cursor-pointer min-w-50">
                                <SelectValue placeholder="Tipos de equipos" />
                            </SelectTrigger>
                            <SelectContent >
                                <SelectItem key='all' value='all' className="cursor-pointer">
                                    Todos los tipos
                                </SelectItem>
                                {Object.entries(tiposLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value} className="cursor-pointer">
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
                            <SelectTrigger className="cursor-pointer min-w-50">
                                <SelectValue placeholder="Condiciones de equipos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem key='all' value='all' className="cursor-pointer">
                                    Todas las condiciones
                                </SelectItem>
                                {condiciones.map((c) => (
                                    <SelectItem key={c.value} value={c.value} className="cursor-pointer">
                                        {c.value === 'Operativo' ? 'Operativo' : 'No operativo'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Ubicación */}
                    <div>
                        <Select
                            value={region}
                            onValueChange={(val) => setRegion(val || undefined)}
                        >
                            <SelectTrigger className="cursor-pointer min-w-50">
                                <SelectValue placeholder="Ubicaciones de equipos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem key='all' value='all' className="cursor-pointer">
                                    Todos las ubicaciones
                                </SelectItem>
                                {ubicaciones.map((u) => (
                                    <SelectItem key={u.value} value={u.value} className="cursor-pointer">
                                        {u.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end mt-2">
                        <Button variant="ghost" size="sm" onClick={clearFilters} className='cursor-pointer'>
                            Limpiar filtros
                        </Button>
                    </div>

                </div>

                {/* Vista de equipos , flex flex-col gap-4*/}
                <div className={classNameViewMode}>
                    {equipos.data.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No se encontraron equipos
                        </div>
                    ) : (
                        equipos.data.map((equipo) => (
                            <EquipoCard
                                key={equipo.id}
                                equipo={equipo}
                                tiposLabels={tiposLabels}
                                estadosLabls={estadosLabels}
                                permissions={permissions}
                                onCardClick={handleCardClick}
                                onCardEditClick={handleEditClick}
                                onScheduleClick={handleScheduleClick}
                            />
                        ))
                    )}
                </div>
                

                {/* Paginación */}
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                        Mostrando {equipos.data.length} de {equipos.total} equipos
                    </div>
                    <div className="flex gap-1">
                        {equipos.links.map((link, index) => (
                            <Button
                                className='cursor-pointer'
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

                <EquipoDetailModal
                    equipo={selectedEquipo}
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    tiposLabels={tiposLabels}
                    estadosLabels={estadosLabels}
                />

                <EquipoEditModal
                    equipoId={editEquipoId}
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                />

                <EquipoMantenimientoDialog
                    equipo={scheduleEquipo}
                    isOpen={scheduleModalOpen}
                    onClose={() => setScheduleModalOpen(false)}
                />
                
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