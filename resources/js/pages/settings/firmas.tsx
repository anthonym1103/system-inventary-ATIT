import { Head, useForm } from '@inertiajs/react';
import { InfoIcon, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Pencil, X, Check, Save} from 'lucide-react';
import { Label } from '@/components/ui/label';

type FirmaInfo = { exists: boolean; updated_at: number | null; nombre: string; area: string };

type FirmaFormData = {
    firma1: File | null;
    firma2: File | null;
    nombre1: string;
    nombre2: string;
    area1: string;
    area2: string;
};

type FirmaKey = 'firma1' | 'firma2';

export default function Firmas({
    firmas,
}: {
    firmas: Record<FirmaKey, FirmaInfo>;
}) {
    const [editing, setEditing] = useState(false);
    const [preview1, setPreview1] = useState<string | null>(null);
    const [preview2, setPreview2] = useState<string | null>(null);
    const input1 = useRef<HTMLInputElement>(null);
    const input2 = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, recentlySuccessful, reset } =
        useForm<FirmaFormData>({
            firma1: null,
            firma2: null,
            nombre1: firmas.firma1.nombre ?? '',
            nombre2: firmas.firma2.nombre ?? '',
            area1: firmas.firma1.area ?? '',
            area2: firmas.firma2.area ?? '',
        });

    const handleFileChange = (
        key: FirmaKey,
        setPreview: (url: string | null) => void,
    ) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData(key, file);
        setPreview(file ? URL.createObjectURL(file) : null);
    };

    const startEditing = () => {
        // Al entrar en modo edición, recargamos los valores actuales
        // del JSON por si el usuario había cancelado antes.
        setData('nombre1', firmas.firma1.nombre ?? '');
        setData('nombre2', firmas.firma2.nombre ?? '');
        setData('area1', firmas.firma1.area ?? '');
        setData('area2', firmas.firma2.area ?? '');
        setEditing(true);
    };

    const cancelEditing = () => {
        reset();
        setPreview1(null);
        setPreview2(null);
        if (input1.current) input1.current.value = '';
        if (input2.current) input2.current.value = '';
        setEditing(false);
    };

    const submit = () => {
        post('/settings/firmas', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setData('firma1', null);
                setData('firma2', null);
                setPreview1(null);
                setPreview2(null);
                if (input1.current) input1.current.value = '';
                if (input2.current) input2.current.value = '';
                setEditing(false);
            },
        });
    };

    const hasChanges =
        data.firma1 !== null ||
        data.firma2 !== null ||
        data.nombre1 !== (firmas.firma1.nombre ?? '') ||
        data.nombre2 !== (firmas.firma2.nombre ?? '') ||
        data.area1 !== (firmas.firma1.area ?? '') ||
        data.area2 !== (firmas.firma2.area ?? '');

    return (
        <>
            <Head title="Firmas" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Firmas del documento de desincorporación"
                        description="Estas firmas se usan en el PDF de desincorporación de equipos."
                    />
                </div>

                <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>Formato requerido</AlertTitle>
                    <AlertDescription>
                        Solo se aceptan imágenes en formato <strong>PNG</strong>
                        Otros formatos serán rechazados automáticamente.
                    </AlertDescription>
                </Alert>

                <div className="grid gap-6 md:grid-cols-2">
                    <FirmaField
                        firmaKey="firma1"
                        inputRef={input1}
                        label="Elaborado por:"
                        info={firmas.firma1}
                        preview={preview1}
                        error={errors.firma1}
                        nombre={data.nombre1}
                        nombreError={errors.nombre1}
                        area={data.area1}
                        areaError={errors.area1}
                        editing={editing}
                        onChange={handleFileChange('firma1', setPreview1)}
                        onNombreChange={(e) => setData('nombre1', e.target.value)}
                        onAreaChange={(e) => setData('area1', e.target.value)}
                    />
                    <FirmaField
                        firmaKey="firma2"
                        inputRef={input2}
                        label="Revisado y aprovado por:"
                        info={firmas.firma2}
                        preview={preview2}
                        error={errors.firma2}
                        nombre={data.nombre2}
                        nombreError={errors.nombre2}
                        area={data.area2}
                        areaError={errors.area2}
                        editing={editing}
                        onChange={handleFileChange('firma2', setPreview2)}
                        onNombreChange={(e) => setData('nombre2', e.target.value)}
                        onAreaChange={(e) => setData('area2', e.target.value)}
                    />
                </div>

                {editing ? (
                    <div className="flex justify-end items-center gap-4">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    disabled={!hasChanges || processing}
                                    className="cursor-pointer"
                                >
                                    <Save className="h-3.5 w-3.5" />
                                    Guardar firmas
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>¿Reemplazar firma(s)?</DialogTitle>
                                <DialogDescription>
                                    Esta acción reemplazará permanentemente{' '}
                                    {data.firma1 && data.firma2
                                        ? 'ambas firmas actuales'
                                        : 'la información seleccionada'}{' '}
                                    en el sistema. Todos los PDFs de
                                    desincorporación generados a partir de ahora
                                    usarán la(s) nueva(s) firma(s) y/o nombre(s).
                                    Esta acción no se puede deshacer.
                                </DialogDescription>
                                <DialogFooter className="gap-2">
                                    <DialogClose asChild>
                                        <Button variant="outline" className="cursor-pointer">
                                            <X className="h-3.5 w-3.5" />
                                            Cancelar
                                        </Button>
                                    </DialogClose>
                                    <DialogClose asChild>
                                        <Button
                                            onClick={submit}
                                            disabled={processing}
                                            className="cursor-pointer"
                                        >
                                            <Check className="h-3.5 w-3.5" />
                                            {processing
                                                ? 'Guardando...'
                                                : 'Sí, reemplazar'}
                                        </Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={cancelEditing}
                            disabled={processing}
                            className="cursor-pointer"
                        >
                            <X className="h-3.5 w-3.5" />
                            Cancelar
                        </Button>

                        {recentlySuccessful && (
                            <p className="text-sm text-neutral-600">
                                Firma(s) actualizada(s) correctamente.
                            </p>
                        )}
                    </div>
                ):(
                    <div className="flex justify-end items-center gap-4">  
                        <Button
                            type="button"
                            variant="outline"
                            onClick={startEditing}
                            className="cursor-pointer"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}

function FirmaField({
    firmaKey,
    inputRef,
    label,
    info,
    preview,
    error,
    nombre,
    nombreError,
    area,
    areaError,
    editing,
    onChange,
    onNombreChange,
    onAreaChange,
}: {
    firmaKey: FirmaKey;
    inputRef: React.RefObject<HTMLInputElement | null>;
    label: string;
    info: FirmaInfo;
    preview: string | null;
    error?: string;
    nombre: string;
    nombreError?: string;
    area: string;
    areaError?: string;
    editing: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onNombreChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAreaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
    const currentUrl = info.exists
        ? `/settings/firmas/${firmaKey}/preview?v=${info.updated_at}`
        : null;

    const triggerFileSelect = () => {
        inputRef.current?.click();
    };

    return (
        <div className="rounded-lg border border-border bg-card p-4">
            <Label className="mb-3 block text-sm font-semibold">{label}</Label>

            <div className="grid gap-4">
                {/* Nombre: va primero, arriba de la firma */}
                <div className="grid gap-1.5">
                    <Label htmlFor={`${firmaKey}-nombre`} className="text-xs text-neutral-500">
                        Nombre a mostrar en el PDF
                    </Label>

                    {editing ? (
                        <input
                            id={`${firmaKey}-nombre`}
                            type="text"
                            value={nombre}
                            onChange={onNombreChange}
                            placeholder="Ingrese el nombre..."
                            className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                    ) : (
                        <span
                            className={
                                info.nombre
                                    ? 'text-sm font-medium'
                                    : 'text-sm text-neutral-400 italic'
                            }
                        >
                            {info.nombre || 'Sin nombre asignado'}
                        </span>
                    )}

                    <InputError message={nombreError} />
                </div>

                {/* Separador visual entre nombre y area */}
                <div className="h-px w-full bg-border" />

                {/* Área de desempeño */}
                <div className="grid gap-1.5">
                    <Label htmlFor={`${firmaKey}-area`} className="text-xs text-neutral-500">
                        Área de desempeño
                    </Label>

                    {editing ? (
                        <textarea
                            id={`${firmaKey}-area`}
                            className="border-input flex min-h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                            value={area}
                            onChange={onAreaChange}
                        />
                    ) : (
                        <span className={info.area ? 'text-sm font-medium' : 'text-sm text-neutral-400 italic'}>
                            {info.area || 'Sin área asignada'}
                        </span>
                    )}

                    <InputError message={areaError} />
                </div>

                {/* Separador visual entre area y firma */}
                <div className="h-px w-full bg-border" />

                {/* Firma: va debajo, simulando cómo se ve en el PDF */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-16 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white">
                        {preview ? (
                            <img
                                src={preview}
                                alt={label}
                                className="max-h-full max-w-full object-contain"
                            />
                        ) : currentUrl ? (
                            <img
                                src={currentUrl}
                                alt={label}
                                className="max-h-full max-w-full object-contain"
                            />
                        ) : (
                            <span className="text-xs text-neutral-400">Sin firma</span>
                        )}
                    </div>

                    {editing && (
                        <button
                            type="button"
                            onClick={triggerFileSelect}
                            className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium transition hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                        >
                            <Upload className="h-3.5 w-3.5 shrink-0" />
                            Seleccionar imagen
                        </button>
                    )}

                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/png,.png"
                        className="hidden"
                        onChange={onChange}
                    />
                </div>

                <InputError message={error} />
            </div>
        </div>
    );
}