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
import { toast } from 'sonner';


function SkeletonCard() {
    return (
        <Card className="animate-pulse">
            <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted h-12 w-12" />
                        <div className="space-y-2">
                            <div className="h-4 w-24 bg-muted rounded" />
                            <div className="h-3 w-16 bg-muted rounded" />
                            <div className="h-3 w-20 bg-muted rounded" />
                        </div>
                    </div>
                    <div className="h-5 w-16 bg-muted rounded" />
                </div>
                <div className="space-y-2">
                    <div className="h-3 w-32 bg-muted rounded" />
                    <div className="h-3 w-40 bg-muted rounded" />
                    <div className="h-3 w-36 bg-muted rounded" />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                    <div className="h-8 w-20 bg-muted rounded" />
                    <div className="h-8 w-16 bg-muted rounded" />
                </div>
            </CardContent>
        </Card>
    );
}

function SkeletonGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

function SkeletonTable() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-10 w-full bg-muted rounded" />
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <div className="h-8 w-8 bg-muted rounded-full" />
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-4 w-16 bg-muted rounded" />
                    <div className="h-4 w-20 bg-muted rounded" />
                    <div className="h-4 w-12 bg-muted rounded" />
                    <div className="h-4 w-12 bg-muted rounded" />
                    <div className="h-4 w-12 bg-muted rounded ml-auto" />
                </div>
            ))}
        </div>
    );
}

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
    condicion: 'operativo' | 'no_operativo';
    area: string;
    detalle: string;
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
    condicionesLabels: Record<string, string>;
    condiciones: Array<{ value: string, label: string }>
    ubicaciones: Array<{ value: string, label: string }>;
    filters: {
        search: string;
        tipo: string;
        condicion: string;
        estado_region: string;
        area: string;
    };
    permissions: {
        can_create: boolean;
        can_edit: boolean;
        can_delete: boolean;
        can_viewHistorial: boolean;
    };
}

export default function EquiposIndex({ equipos, tiposLabels, estadosLabels, condicionesLabels, condiciones, ubicaciones, filters, permissions }: Props) {
    // Inicializar con undefined en lugar de '' para evitar el valor vacío
    const [search, setSearch] = useState(filters.search || '');
    const [tipo, setTipo] = useState<string | undefined>(filters.tipo || undefined);
    const [condicion, setCondicion] = useState<string | undefined>(filters.condicion || undefined);
    const [region, setRegion] = useState<string | undefined>(filters.estado_region || undefined);
    const [area] = useState<string | undefined>(filters.area || undefined);
    const [selectedEquipoId, setSelectedEquipoId] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editEquipoId, setEditEquipoId] = useState<number | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [classNameViewMode, setClassNameViewMode] = useState<string>('flex flex-col gap-4');
    const [scheduleEquipo, setScheduleEquipo] = useState<any>(null);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const debouncedSearch = useDebounce(search, 300);
    const [isLoading, setIsLoading] = useState(false);
    const params: Record<string, string> = {};

    // Aplicar filtros cuando cambien

    useEffect(() => {
        const onStart = () => setIsLoading(true);
        const onFinish = () => setIsLoading(false);

        const removeStart = router.on('start', onStart);
        const removeFinish = router.on('finish', onFinish);

        return () => {
            removeStart();
            removeFinish();
        };
    }, []);

    
    useEffect(() => {
        if (debouncedSearch) params.search = debouncedSearch;
        if (tipo) params.tipo = tipo;
        if (condicion) params.condicion = condicion;
        if (region) params.estado_region = region;
        if (area) params.area = area;
        
        router.get('/equipos', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [debouncedSearch, tipo, condicion, region, area]);

    const toggleSelected = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const handleDesincorporar = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`¿Desincorporar ${selectedIds.length} equipo(s)? Esta acción no se puede deshacer.`)) return;

        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

        const response = await fetch('/equipos/desincorporar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrf,
            },
            credentials: 'same-origin',
            body: JSON.stringify({ equipo_ids: selectedIds }),
        });

        if (!response.ok) {
            // Intenta leer el mensaje real del servidor
            const contentType = response.headers.get('content-type') ?? '';
            let errorMessage = 'No se pudieron desincorporar los equipos.';

            if (contentType.includes('application/json')) {
                const data = await response.json();
                errorMessage = data.error || data.message || errorMessage;
            }

            console.error('Error al desincorporar:', errorMessage);
            toast.error(errorMessage);
            return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `desincorporacion_${Date.now()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);

        setSelectedIds([]);
        setSelectMode(false);
        router.reload({ only: ['equipos'] });
    };

    const clearFilters = () => {
        setSearch('');
        setTipo(undefined);
        setCondicion(undefined);
        setRegion(undefined);

        if(area){
            router.get('/equipos', {area: area}, { preserveState: false });
        }else{
            router.get('/equipos', {}, { preserveState: false });
        }

    };

    const handlePageChange = (url: string | null) => {
        if (url) router.get(url, {}, { preserveState: true, preserveScroll: false });
    };

    const handleCardClick = (equipo: any) => {
        // Cargar detalles completos del equipo (con relaciones) si no están cargados
        // En tu caso, podrías hacer una llamada a /equipos/{id} con ?with=infraestructura,rede,transmision
        // O pasar los datos completos desde el controlador
        setSelectedEquipoId(equipo.id);
        setModalOpen(true);
    };

    const handleClassNameViewMode = (mode: 'grid' | 'list') => {
        setClassNameViewMode(mode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'flex flex-col gap-4');
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

    // Determinar si mostrar skeleton
    const showSkeleton = isLoading && equipos.data.length === 0;

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
                        {(permissions.can_create && !selectMode) && (
                            <div className='flex gap-2'>
                                <Button variant="outline" asChild>
                                    <Link href="/equipos/create">
                                        <Plus className="h-4 w-4" />
                                        Agregar nuevo equipo
                                    </Link>
                                </Button>
                                <Button 
                                    variant="destructiveNotification" 
                                    onClick={() => setSelectMode(true)}
                                    className="cursor-pointer" 
                                    disabled = {selectMode} 
                                >
                                    <FileX className="h-3.5 w-3.5" />
                                    Desincorporar equipos
                                </Button>
                            </div>
                        )}
                        {selectMode && (
                            <div className="flex items-center justify-between p-3">
                                <span className="text-sm mr-4">
                                    {selectedIds.length} equipo(s) seleccionado(s)
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="destructiveNotification"
                                        onClick={handleDesincorporar}
                                        className="cursor-pointer"
                                        disabled={selectedIds.length === 0}
                                    >
                                        Confirmar desincorporación
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectMode(false);
                                            setSelectedIds([]);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
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
                            <SelectContent className="max-h-72 overflow-y-auto">
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
                                        {c.label}
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
                {showSkeleton ? (
                    viewMode === 'grid' ? <SkeletonGrid /> : <SkeletonTable />
                ) : (
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
                                    valueViewMode={viewMode}
                                    condicionesLabels={condicionesLabels}
                                    permissions={permissions}
                                    selectMode = {selectMode}
                                    selectedIds={selectedIds}
                                    onToggleSelect={toggleSelected}
                                    onCardClick={handleCardClick}
                                    onCardEditClick={handleEditClick}
                                    onScheduleClick={handleScheduleClick}
                                />
                            ))
                        )}
                    </div>
                )}

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
                    equipoId={selectedEquipoId}
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    tiposLabels={tiposLabels}
                    estadosLabels={estadosLabels}
                    condidicionesLabels={condicionesLabels}
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