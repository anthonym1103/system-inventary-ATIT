import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EquipoForm, Encargado} from '@/components/equipo-form';

interface Props {
    tiposLabels: Record<string, string>;
    ubicaciones: Array<{ value: string, label: string }>;
    sedes: Array<{ value: string; label: string; region: string }>;
    pisos: Array<{ value: string, label: string }>;
    condiciones: Array<{ value: string; label: string }>;
    encargados: Encargado[];
}

export default function EquipoCreate({ tiposLabels, ubicaciones, sedes, pisos, condiciones, encargados }: Props) {

    return (
        <>
            <Head title="Nuevo Equipo" />
            <div className="p-6 w-full space-y-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/equipos">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Nuevo Equipo</h1>
                </div>

                <EquipoForm
                    mode="create"
                    tiposLabels={tiposLabels}
                    ubicaciones={ubicaciones}
                    sedesOptions={sedes}
                    pisosOptions={pisos}
                    condiciones = {condiciones}
                    encargados={encargados}
                />
            </div>
        </>
    );
}

EquipoCreate.layout = {
    breadcrumbs: [
        { title: 'Inventario', href: '/equipos' },
        { title: 'Nuevo Equipo', href: '/equipos/create' },
    ],
};