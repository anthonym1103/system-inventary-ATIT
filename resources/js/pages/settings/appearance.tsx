import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Configuracion" />

            <h1 className="sr-only">Configurar Apariencia</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Configurar Apariencia"
                    description="Seleccione la opcion de su preferencia"
                />
                <AppearanceTabs />
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Configuracion de apariencia',
            href: editAppearance(),
        },
    ],
};
