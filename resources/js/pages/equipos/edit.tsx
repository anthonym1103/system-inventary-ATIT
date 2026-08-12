import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EquipoForm } from '@/components/equipo-form';
import type { EquipoFormData, TipoConfig } from '@/components/equipo-form';

interface Props {
    equipo: Partial<EquipoFormData> & { id: number; tiene_contrasena_bios?: boolean };
    tiposLabels: Record<string, string>;
    camposPorTipo: Record<string, TipoConfig>;
    ubicaciones: Array<{ value: string, label: string }>;
    sedes: Array<{ value: string, label: string }>;
    pisos: Array<{ value: string, label: string }>;
    condiciones: Array<{ value: string; label: string }>;
}

export default function EquipoEdit({ equipo, tiposLabels, camposPorTipo, ubicaciones, sedes, pisos, condiciones }: Props) {
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
                    sedesOptions={sedes}
                    pisosOptions={pisos}
                    condiciones= {condiciones}
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