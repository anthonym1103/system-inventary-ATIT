import { Link } from '@inertiajs/react';
import { BookOpen, ClipboardList, FolderGit2, LayoutGrid, Package, LayoutDashboard, History, Layers, LucideUsers } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { Notifications } from '@/components/notifications';
import { usePage } from '@inertiajs/react';
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
        title: 'Dashboard',
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
            href: '',
            icon: LucideUsers,
        });
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
                {/*<NavFooter items={footerNavItems} className="mt-auto" />*/}

                <Notifications />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
