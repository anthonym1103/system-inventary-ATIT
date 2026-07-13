import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { equipoIconMap } from '@/lib/equipo-icons';

interface HistorialEntry {
    id: number;
    detalle: string;
    fecha_ajuste: string;
    usuario: { id: number; name: string } | null;
    equipo: { id: number; tipo: string; serial: string } | null;
}

interface Props {
    historial: { data: HistorialEntry[]; links: any[]; current_page: number; last_page: number; total: number };
    filters: { equipo_id?: string; usuario_id?: string };
    usuarios: { id: number; name: string }[];
    equipos: { id: number; marca: string; modelo: string; serial: string }[];
    tiposLabels: Record<string, string>;
}

function DetalleDisplay({ detalle }: { detalle: string }) {
    const colonIndex = detalle.indexOf(':');

    if (colonIndex === -1) {
        return <p className="text-sm">{detalle}</p>;
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
                    <li key={i}>{item}</li>
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

export default function HistorialIndex({ historial, filters, usuarios, tiposLabels }: Props) {
    const [equipoId, setEquipoId] = useState<string>(filters.equipo_id || '');
    const [usuarioId, setUsuarioId] = useState<string>(filters.usuario_id || '');
    const getInitials = useInitials();

    useEffect(() => {
        const params: Record<string, string> = {};
        if (equipoId && equipoId !== 'all') params.equipo_id = equipoId;
        if (usuarioId && usuarioId !== 'all') params.usuario_id = usuarioId;
        router.get('/historial', params, { preserveState: true, preserveScroll: true, replace: true });
    }, [equipoId, usuarioId]);

    const clearFilters = () => {
        setEquipoId('');
        setUsuarioId('');
        router.get('/historial', {}, { preserveState: false });
    };

    return (
        <>
            <Head title="Historial de Cambios" />
            <div className="p-6 space-y-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="text-sm font-medium">Tipo de equipo</label>
                        <Select value={equipoId} onValueChange={setEquipoId}>
                            <SelectTrigger className="w-60 cursor-pointer">
                                <SelectValue placeholder="Todos los tipos" />
                            </SelectTrigger>
                            <SelectContent className="max-h-72 overflow-y-auto">
                                <SelectItem value="all">Todos los tipos</SelectItem>
                                {Object.entries(tiposLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Usuario</label>
                        <Select value={usuarioId} onValueChange={setUsuarioId}>
                            <SelectTrigger className="w-48 cursor-pointer">
                                <SelectValue placeholder="Todos los usuarios" />
                            </SelectTrigger>
                            <SelectContent className="max-h-72 overflow-y-auto">
                                <SelectItem value="all">Todos los usuarios</SelectItem>
                                {usuarios.map((u) => (
                                    <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="ghost" onClick={clearFilters}>Limpiar filtros</Button>
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
                                            <TableCell className="align-top">
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