import type { Auth } from '@/types/auth';
import type { Mantenimiento } from '@/types/ui';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            mantenimientosPendientes: Mantenimiento[];
            [key: string]: unknown;
        };
    }
}

