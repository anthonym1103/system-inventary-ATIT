import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { equipoIconMap } from '@/lib/equipo-icons';
import { Input } from '@/components/ui/input';

interface HistorialEntry {
    id: number;
    detalle: string;
    fecha_ajuste: string;
    usuario: { id: number; name: string } | null;
    equipo: { id: number; tipo: string; serial: string } | null;
}

interface Props {
    historial: { 
        data: HistorialEntry[]; 
        links: any[]; 
        current_page: number; 
        last_page: number; 
        total: number 
    };
    filters: { search: string, tipo: string };
    tiposLabels: Record<string, string>;
}

function DetalleItem({ text }: { text: string }) {
    const [expanded, setExpanded] = useState(false);
    const LIMIT = 140;
    const isLong = text.length > LIMIT;
    const display = expanded || !isLong ? text : text.slice(0, LIMIT) + '…';

    return (
        <li className="break-words">
            {display}
            {isLong && (
                <button
                    type="button"
                    onClick={() => setExpanded((prev) => !prev)}
                    className="ml-1 cursor-pointer text-xs font-medium text-primary hover:underline"
                >
                    {expanded ? 'Ver menos' : 'Ver más'}
                </button>
            )}
        </li>
    );
}

function DetalleDisplay({ detalle }: { detalle: string }) {
    const colonIndex = detalle.indexOf(':');

    if (colonIndex === -1) {
        return <p className="text-sm break-words">{detalle}</p>;
    }

    const header = detalle.slice(0, colonIndex);
    const items = detalle
        .slice(colonIndex + 1)
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);

    return (
        <div className="space-y-1 py-1">
            <p className="text-sm font-medium">{header}</p>
            <ul className="ml-4 list-disc space-y-0.5 text-xs text-muted-foreground">
                {items.map((item, i) => (
                    <DetalleItem key={i} text={item} />
                ))}
            </ul>
        </div>
    );
}

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function HistorialIndex({ historial, filters, tiposLabels }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [tipoEquipo, setTipoEquipo] = useState<string>(filters.tipo || '');
    const debouncedSearch = useDebounce(search, 300);
    const getInitials = useInitials();
    const params: Record<string, string> = {};

    useEffect(() => {
        if (debouncedSearch) params.search = debouncedSearch;
        if (tipoEquipo && tipoEquipo !== 'all') params.tipo = tipoEquipo;
        
        router.get('/historial', params, { 
            preserveState: true, 
            preserveScroll: true, 
            replace: true });

    }, [debouncedSearch, search, tipoEquipo]);

    const clearFilters = () => {
        setTipoEquipo('');
        router.get('/historial', {}, { preserveState: false });
    };

    return (
        <>
            <Head title="Historial de Cambios" />
            <div className="p-6 space-y-6">
                <div className="flex flex-wrap gap-4 items-end">
                    
                    {/* Búsqueda */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por serial, usuario, username..."
                            className="pl-8 w-72 sm:w-80"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium">Tipo de equipo</label>
                        <Select value={tipoEquipo} onValueChange={setTipoEquipo}>
                            <SelectTrigger className="w-60 cursor-pointer">
                                <SelectValue placeholder="Todos los tipos" />
                            </SelectTrigger>
                            <SelectContent className="max-h-72 overflow-y-auto">
                                <SelectItem value="all">Todos los tipos</SelectItem>
                                {
                                    Object.entries(tiposLabels).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                    ))

                                }
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="ghost" className="cursor-pointer" onClick={clearFilters}>Limpiar filtros</Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-40">Fecha</TableHead>
                                <TableHead className="w-48">Usuario</TableHead>
                                <TableHead className="w-36">Equipo</TableHead>
                                <TableHead>Detalle</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {historial.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                        No hay registros de historial.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                historial.data.map((entry) => {
                                    const Icon = equipoIconMap[entry.equipo?.tipo ?? ''] || equipoIconMap.micro_escritorio;

                                    return (
                                        <TableRow key={entry.id}>
                                            <TableCell className="align-top whitespace-nowrap text-sm text-muted-foreground">
                                                {new Date(entry.fecha_ajuste).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="align-top">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback className="text-[10px]">
                                                            {getInitials(entry.usuario?.name ?? 'S')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm">{entry.usuario?.name ?? 'Sistema'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top">
                                                <div className="flex items-center gap-1.5">
                                                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                    <span className="font-mono text-xs">{entry.equipo?.serial ?? 'N/A'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top whitespace-normal break-words max-w-md">
                                                <DetalleDisplay detalle={entry.detalle} />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        Mostrando {historial.data.length} de {historial.total} registros
                    </span>
                    <div className="flex gap-1">
                        {historial.links.map((link, idx) => (
                            <Button
                                key={idx}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                className="cursor-pointer"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

HistorialIndex.layout = {
    breadcrumbs: [{ title: 'Historial', href: '/historial' }],
};