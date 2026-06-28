import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EquipoForm } from '@/components/equipo-form';
import type { AsignadoOption, EquipoFormData, TipoConfig, UbicacionOption } from '@/components/equipo-form';

interface Props {
    equipo: Partial<EquipoFormData> & { id: number; tiene_contrasena_bios?: boolean };
    tiposLabels: Record<string, string>;
    camposPorTipo: Record<string, TipoConfig>;
    ubicaciones: UbicacionOption[];
    asignados: AsignadoOption[];
}

export default function EquipoEdit({ equipo, tiposLabels, camposPorTipo, ubicaciones, asignados }: Props) {
    const { id, tiene_contrasena_bios, ...initialData } = equipo;

    return (
        <>
            <Head title="Editar Equipo" />
            <div className="p-6 max-w-4xl space-y-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/equipos">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Editar Equipo</h1>
                </div>

                <EquipoForm
                    mode="edit"
                    equipoId={id}
                    tiposLabels={tiposLabels}
                    camposPorTipo={camposPorTipo}
                    ubicaciones={ubicaciones}
                    asignados={asignados}
                    initialData={initialData}
                    tieneContrasenaBios={tiene_contrasena_bios}
                />
            </div>
        </>
    );
}

EquipoEdit.layout = {
    breadcrumbs: [
        { title: 'Inventario', href: '/equipos' },
        { title: 'Editar Equipo', href: '#' },
    ],
};