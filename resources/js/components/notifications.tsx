import { router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { equipoIconMap } from '@/lib/equipo-icons';


export function Notifications() {
    const { mantenimientosPendientes } = usePage().props;
    const pendientes = mantenimientosPendientes ?? [];
    const count = pendientes.length;

    const marcarLeido = (id: number) => {
        router.patch(`/mantenimientos/${id}/leido`, {}, { preserveScroll: true });
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="group text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent"
                        >
                            <Bell className="ml-2 size-4" />
                            <span>Notificaciones</span>
                            {count > 0 && (
                                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-medium text-white">
                                    {count}
                                </span>
                            )}
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className={`ml-4 rounded-lg max-h-72 overflow-y-auto ${count === 0 ? "w-[95%]" : "w-[78%]"}`} align="end" side="top">
                        <DropdownMenuLabel className="w-full flex justify-center">Recordatorios de mantenimiento</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {count === 0 && (
                            <p className="px-2 py-3 text-sm text-muted-foreground">
                                No tienes recordatorios pendientes.
                            </p>
                        )}

                        {pendientes.map((m) => {
                            const Icon = equipoIconMap[m.equipo?.tipo ?? ''] || equipoIconMap.micro_escritorio;

                            return (
                                <DropdownMenuItem
                                    key={m.id}
                                    className="flex flex-col items-start gap-1 py-2 select-text"
                                    onSelect={(e) => e.preventDefault()}
                                >
                                    <div className="flex w-full items-start gap-2">
                                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div className="flex-1 space-y-0.5">
                                            <p className="text-sm font-medium leading-tight cursor-text w-fit">
                                                {m.equipo
                                                    ? `Equipo: ${m.equipo.modelo}`.trim()
                                                    : 'Equipo'}
                                            </p>
                                            {m.equipo?.serial && (
                                                <p className="text-xs text-muted-foreground cursor-text w-fit">
                                                    Serial: {m.equipo.serial}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground cursor-text w-fit">
                                                Programado para hoy: {new Date(m.fecha_mantenimiento.replace('Z','')).toLocaleDateString()}
                                            </p>
                                            {m.detalle && <p className="text-xs mt-2 cursor-text w-fit">Descripcion: {m.detalle}</p>}
                                        </div>
                                    </div>
                                    <div className="w-full flex justify-end">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 px-2 text-xs cursor-pointer"
                                            onClick={() => marcarLeido(m.id)}
                                        >
                                            Marcar como leído
                                        </Button>
                                    </div>
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}