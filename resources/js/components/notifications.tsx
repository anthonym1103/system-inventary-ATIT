import { router, usePage } from '@inertiajs/react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import type { Mantenimiento } from '@/types/ui';

export function Notifications() {
    const { notificaciones, notificacionesPendientes } = usePage().props;
    const [list, setList] = useState<Mantenimiento[]>(notificaciones ?? []);
    const [open, setOpen] = useState(false);

    // Cuando se abre el dropdown, no hacemos nada especial, el badge ya muestra el conteo.
    // El contador se actualiza cuando cambian las props.

    const markAsRead = (id: number) => {
        router.patch(
            `/mantenimientos/${id}/leido`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Actualizar el estado local: cambiar leido a true
                    setList((prev) =>
                        prev.map((item) =>
                            item.id === id ? { ...item, leido: true } : item
                        )
                    );
                },
            }
        );
    };

    const deleteNotification = (id: number) => {
        if (!confirm('¿Eliminar esta notificación?')) return;
        router.delete(
            `/mantenimientos/${id}`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Eliminar de la lista local
                    setList((prev) => prev.filter((item) => item.id !== id));
                },
            }
        );
    };

    const count = notificacionesPendientes ?? 0;

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu open={open} onOpenChange={setOpen}>
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
                    <DropdownMenuContent
                        className={`ml-4 rounded-lg max-h-72 overflow-y-auto ${
                            list.length === 0 ? 'w-[95%]' : 'w-[78%]'
                        }`}
                        align="end"
                        side="top"
                    >
                        <DropdownMenuLabel className="w-full flex justify-center">
                            Recordatorios de mantenimiento
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {list.length === 0 && (
                            <p className="px-2 py-3 text-sm text-muted-foreground">
                                No tienes recordatorios.
                            </p>
                        )}

                        {list.map((m) => {
                            const Icon =
                                equipoIconMap[m.equipo?.tipo ?? ''] ||
                                equipoIconMap.micro_escritorio;

                            return (
                                <DropdownMenuItem
                                    key={m.id}
                                    className={`flex flex-col items-start gap-1 py-2 select-text ${
                                        m.leido ? 'opacity-60' : ''
                                    }`}
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
                                                Programado para:{' '}
                                                {new Date(
                                                    m.fecha_mantenimiento
                                                ).toLocaleDateString()}
                                            </p>
                                            {m.detalle && (
                                                <p className="text-xs mt-2 cursor-text w-fit">
                                                    Descripción: {m.detalle}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex w-full justify-end gap-2 mt-1">
                                        {!m.leido && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 px-2 text-xs cursor-pointer"
                                                onClick={() =>
                                                    markAsRead(m.id)
                                                }
                                            >
                                                <Check className="h-3 w-3 mr-1" />
                                                Marcar leído
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 px-2 text-xs cursor-pointer text-destructive hover:text-destructive"
                                            onClick={() =>
                                                deleteNotification(m.id)
                                            }
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" />
                                            Borrar
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