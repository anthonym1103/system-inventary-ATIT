import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Search, Pencil, X, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

interface UserRow {
    id: number;
    name: string;
    user_name: string;
    email: string;
    area: string | null;
    avatar?: string;
    role: string | null;
}

interface RoleOption {
    value: string;
    label: string;
}

interface Props {
    users: {
        data: UserRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        total: number;
    };
    rolesByArea: Record<string, RoleOption[]>;
    areaLabels: Record<string, string>;
    filters: { search: string };
}

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

export default function UsuariosIndex({
    users,
    rolesByArea,
    areaLabels,
    filters,
}: Props) {
    const { auth } = usePage().props;
    const getInitials = useInitials();

    const [search, setSearch] = useState(filters.search || '');
    const debouncedSearch = useDebounce(search, 300);

    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const params: Record<string, string> = {};

        if (debouncedSearch) {
            params.search = debouncedSearch;
        }

        router.get('/usuarios', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [debouncedSearch]);

    const startEditing = (user: UserRow) => {
        setEditingUserId(user.id);
        setSelectedRole(user.role || '');
    };

    const cancelEditing = () => {
        setEditingUserId(null);
        setSelectedRole('');
    };

    const saveRole = (user: UserRow) => {
        if (!selectedRole || selectedRole === user.role) {
            cancelEditing();
            return;
        }

        setProcessing(true);

        router.patch(
            `/usuarios/${user.id}/role`,
            { role: selectedRole },
            {
                preserveScroll: true,
                onSuccess: cancelEditing,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const roleLabel = (roleValue: string | null): string => {
        if (!roleValue) {
            return 'Sin rol asignado';
        }

        if (roleValue === 'administrador') {
            return 'Administrador';
        }

        for (const options of Object.values(rolesByArea)) {
            const match = options.find((o) => o.value === roleValue);

            if (match) {
                return match.label;
            }
        }

        return roleValue;
    };

    const isSelf = (userId: number) => userId === auth.user.id;

    // Un usuario con rol Administrador no puede ser editado desde aquí
    const isAdmin = (role: string | null) => role === 'administrador';

    const canEdit = (user: UserRow) => !isSelf(user.id) && !isAdmin(user.role);

    return (
        <>
            <Head title="Gestión de Usuarios" />
            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre, usuario o correo..."
                            className="pl-8 w-72"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <Card>
                    <CardContent className="pt-2">
                        <div className = "overflow-x-auto">
                            <Table className="w-full table-fixed min-w-[700px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[25%] text-center">Usuario</TableHead>
                                        <TableHead className="w-[25%] text-center">Correo</TableHead>
                                        <TableHead className="w-[18%] text-center">Área</TableHead>
                                        <TableHead className="w-[17%] text-center">Rol</TableHead>
                                        <TableHead className="w-[15%] text-center">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.data.map((user) => {
                                        const isEditing = editingUserId === user.id;
                                        const options = user.area ? (rolesByArea[user.area] ?? []) : [];
                                        const editable = canEdit(user);

                                        return (
                                            <TableRow key={user.id}>
                                                <TableCell> 
                                                    <div className="flex justify-center gap-2">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage
                                                                src={user.avatar}
                                                                alt={user.name}
                                                            />
                                                            <AvatarFallback>
                                                                {getInitials(user.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="truncate">
                                                            <p className="font-medium leading-none truncate">
                                                                {user.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                @{user.user_name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell >
                                                    <div className="flex flex-col items-center justify-center space-y-0.5 truncate">
                                                        <p className="text-sm truncate">{user.email}</p>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex justify-center">
                                                        {user.area
                                                            ? (isAdmin(user.role) ? (
                                                                    "Todas"
                                                                ):(areaLabels[user.area] ?? user.area)
                                                            ):(
                                                                <span className="text-muted-foreground text-sm">
                                                                    Sin área
                                                                </span>
                                                            )}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex justify-center">
                                                        {isEditing ? (
                                                            <Select
                                                                value={selectedRole}
                                                                onValueChange={setSelectedRole}
                                                            >
                                                                <SelectTrigger className="w-fit">
                                                                    <SelectValue placeholder="Selecciona un rol" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {options.map((opt) => (
                                                                        <SelectItem
                                                                            key={opt.value}
                                                                            value={opt.value}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            {opt.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <Badge
                                                                className="w-fit px-2 py-1"
                                                                variant={
                                                                    isAdmin(user.role)
                                                                        ? 'default'
                                                                        : 'secondary'
                                                                }
                                                            >
                                                                {roleLabel(user.role)}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    {isEditing ? (
                                                        <div className="flex justify-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={cancelEditing}
                                                                disabled={processing}
                                                                className="cursor-pointer"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => saveRole(user)}
                                                                disabled={processing}
                                                                className="cursor-pointer"
                                                            >
                                                                <Check className="h-3.5 w-3.5" />
                                                                Guardar
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-center">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => startEditing(user)}
                                                                disabled={!editable}
                                                                className="cursor-pointer"
                                                                title={
                                                                    isSelf(user.id)
                                                                        ? 'No puedes modificar tu propio rol'
                                                                        : isAdmin(user.role)
                                                                            ? 'El rol Administrador no se puede modificar desde aquí'
                                                                                : undefined
                                                                }
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                                Editar rol
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}

                                    {users.data.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="text-center text-muted-foreground py-10"
                                            >
                                                No se encontraron usuarios
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                        Mostrando {users.data.length} de {users.total} usuarios
                    </div>
                    <div className="flex gap-1">
                        {users.links.map((link, index) => (
                            <Button
                                key={index}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                className="cursor-pointer"
                                onClick={() =>
                                    link.url &&
                                    router.get(link.url, {}, { preserveState: true })
                                }
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

UsuariosIndex.layout = {
    breadcrumbs: [
        {
            title: 'Gestión de Usuarios',
            href: '/usuarios',
        },
    ],
};