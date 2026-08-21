import type { ReactNode } from 'react';
import type { BreadcrumbItem } from '@/types/navigation';

export type AppLayoutProps = {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
};

export type AppVariant = 'header' | 'sidebar';

export type FlashToast = {
    type: 'success' | 'info' | 'warning' | 'error';
    message: string;
};

export type AuthLayoutProps = {
    children?: ReactNode;
    name?: string;
    title?: string;
    description?: string;
};

export type Mantenimiento = {
    id: number;
    equipo_id: number;
    fecha_mantenimiento: string;
    detalle: string | null;
    leido: boolean;
    equipo?: {
        id: number;
        tipo: string;
        marca: string | null;
        modelo: string;
        serial: string;
        ubicacion?:{
            id: number;
            estado: string;
            piso: string;
            sede: string;
        };
    };
    
};