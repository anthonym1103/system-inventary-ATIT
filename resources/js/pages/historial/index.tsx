import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface HistorialEntry {
    id: number;
    detalle: string;
    fecha_ajuste: string;
    usuario: { id: number; name: string };
    equipo: { id: number; marca: string; modelo: string; serial: string };
}

interface Props {
    historial: { data: HistorialEntry[]; links: any[]; current_page: number; last_page: number; total: number };
    filters: { equipo_id?: string; usuario_id?: string };
    usuarios: { id: number; name: string }[];
    equipos: { id: number; marca: string; modelo: string; serial: string }[];
    tiposLabels: Record<string, string>;
}

export default function HistorialIndex({ historial, filters, usuarios, equipos, tiposLabels }: Props) {
    const [equipoId, setEquipoId] = useState<string>(filters.equipo_id || '');
    const [usuarioId, setUsuarioId] = useState<string>(filters.usuario_id || '');

    useEffect(() => {
        const params: Record<string, string> = {};
        if (equipoId) params.equipo_id = equipoId;
        if (usuarioId) params.usuario_id = usuarioId;
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

                {/* Filtros */}
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="text-sm font-medium">Equipo</label>
                        <Select value={equipoId} onValueChange={setEquipoId}>
                            <SelectTrigger className="w-60 cursor-pointer">
                                <SelectValue placeholder="Tipos de equipos" />
                            </SelectTrigger>
                            <SelectContent className="max-h-72 overflow-y-auto">
                                <SelectItem key={'all'} value={'all'}>
                                        Todos los tipos
                                </SelectItem>
                                {Object.entries(tiposLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
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
                                <SelectItem key={'all'} value={'all'}>
                                        Todos los usuarios
                                </SelectItem>
                                {usuarios.map((u) => (
                                    <SelectItem key={u.id} value={String(u.id)}>
                                        {u.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="ghost" onClick={clearFilters}>Limpiar filtros</Button>
                </div>

                {/* Tabla */}
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Equipo</TableHead>
                                <TableHead>Detalle</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {historial.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                        No hay registros de historial.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                historial.data.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {new Date(entry.fecha_ajuste).toLocaleString()}
                                        </TableCell>
                                        <TableCell>{entry.usuario?.name || 'Sistema'}</TableCell>
                                        <TableCell>
                                            <span className="font-mono text-sm">
                                                {entry.equipo?.marca} {entry.equipo?.modelo} ({entry.equipo?.serial})
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-md break-words">
                                            {entry.detalle}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Paginación */}
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
    breadcrumbs: [
        { title: 'Historial', href: '/historial' },
    ],
};