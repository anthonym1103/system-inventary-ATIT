import { Link, usePage } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl, isCurrentOrParentUrl, whenCurrentUrl} = useCurrentUrl();
    const { url } = usePage()

    function setValueIsUrl(item: NavItem): boolean {
        var href = isCurrentUrl(item.href);
        const inInfraestructura = (url.includes('/equipos?area=infraestructura') && item.href === '/equipos?area=infraestructura');
        const inRedes = (url.includes('/equipos?area=redes') && item.href === '/equipos?area=redes');
        const inTransmision = (url.includes('/equipos?area=transmision_datos') && item.href === '/equipos?area=transmision_datos');

        if(inInfraestructura){
            href = inInfraestructura;
        }
        if(inRedes){
            href = inRedes;
        }
        if(inTransmision){
            href = inTransmision;
        }

        return href;
    }

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Menu de opciones</SidebarGroupLabel>
            <SidebarMenu>
                {
                items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={setValueIsUrl(item)}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
