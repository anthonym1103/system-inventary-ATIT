import { Link } from '@inertiajs/react';
import { LayoutDashboard, History, Layers, LucideUsers, ClipboardList } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { Notifications } from '@/components/notifications';
import { usePage} from '@inertiajs/react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const baseNavItems: NavItem[] = [
    {
        title: 'Inicio',
        href: dashboard(),
        icon: LayoutDashboard,
    },{
        title:'Inventario',
        href: '/equipos',
        icon: Layers,
    },{
        title:'Historial',
        href: '/historial',
        icon: History,
    },
];


function getNavItems(data: any): NavItem[] {
    if (!data) return baseNavItems;
    const items = [...baseNavItems];
    
    if (data.permissions.includes('asignar_roles')) {
        items.push({
            title: 'Gestion de Usuarios',
            href: '/usuarios',
            icon: LucideUsers,
        },{
            title: 'Sustitución',
            href: '/sustitucion', 
            icon: ClipboardList,
        });
    }
    
    if(data.role === 'administrador'){
        const itemsFildrado = items.filter((navItems) => navItems.title !== 'Inventario');

        const navItems = [{
            title: 'Inventario Infraestructura',
            href: '/equipos?area=infraestructura',
            icon: Layers,
        },{
            title: 'Inventario Redes',
            href: '/equipos?area=redes',
            icon: Layers,
        },{
            title: 'Inventario Transmisión',
            href: '/equipos?area=transmision_datos',
            icon: Layers,
        }];

        const newItems = [
            ...itemsFildrado.slice(0,1),
            ...navItems,
            ...itemsFildrado.slice(1),
        ];

        return newItems;
    }

    return items;
}

/*const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];*/

export function AppSidebar() {
    const { auth } = usePage().props;
    const navItems = getNavItems(auth);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                {auth.permissions.includes('gestionar_notiMantenimiento') && (
                    <Notifications />
                )}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
