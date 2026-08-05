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
import { Label } from '@/components/ui/label';

type FirmaInfo = { exists: boolean; updated_at: number | null };

type FirmaFormData = {
    firma1: File | null;
    firma2: File | null;
};

type FirmaKey = 'firma1' | 'firma2';

export default function Firmas({
    firmas,
}: {
    firmas: Record<FirmaKey, FirmaInfo>;
}) {
    const [preview1, setPreview1] = useState<string | null>(null);
    const [preview2, setPreview2] = useState<string | null>(null);
    const input1 = useRef<HTMLInputElement>(null);
    const input2 = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, recentlySuccessful, reset } =
        useForm<FirmaFormData>({
            firma1: null,
            firma2: null,
        });

    const handleFileChange = (
        key: FirmaKey,
        setPreview: (url: string | null) => void,
    ) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData(key, file);
        setPreview(file ? URL.createObjectURL(file) : null);
    };

    const submit = () => {
        post('/settings/firmas', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setPreview1(null);
                setPreview2(null);
                if (input1.current) input1.current.value = '';
                if (input2.current) input2.current.value = '';
            },
        });
    };

    const hasChanges = data.firma1 !== null || data.firma2 !== null;

    return (
        <>
            <Head title="Configuracion" />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Firmas del documento de desincorporación"
                    description="Estas firmas se usan en el PDF de desincorporación de equipos."
                />

                <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>Formato requerido</AlertTitle>
                    <AlertDescription>
                        Solo se aceptan imágenes en formato <strong>PNG</strong>
                        Otros formatos serán rechazados automáticamente.
                    </AlertDescription>
                </Alert>

                <div className="space-y-6">
                    <FirmaField
                        firmaKey="firma1"
                        inputRef={input1}
                        label="Firma 1 (izquierda)"
                        info={firmas.firma1}
                        preview={preview1}
                        error={errors.firma1}
                        onChange={handleFileChange('firma1', setPreview1)}
                    />
                    <FirmaField
                        firmaKey="firma2"
                        inputRef={input2}
                        label="Firma 2 (derecha)"
                        info={firmas.firma2}
                        preview={preview2}
                        error={errors.firma2}
                        onChange={handleFileChange('firma2', setPreview2)}
                    />
                </div>

                <div className="flex items-center gap-4">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button disabled={!hasChanges || processing} className="cursor-pointer">
                                Guardar firmas
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogTitle>¿Reemplazar firma(s)?</DialogTitle>
                            <DialogDescription>
                                Esta acción reemplazará permanentemente{' '}
                                {data.firma1 && data.firma2
                                    ? 'ambas firmas actuales'
                                    : 'la firma actual seleccionada'}{' '}
                                en el sistema. Todos los PDFs de desincorporación
                                generados a partir de ahora usarán la(s) nueva(s)
                                firma(s). Esta acción no se puede deshacer.
                            </DialogDescription>
                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary" className="cursor-pointer">
                                        Cancelar
                                    </Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button
                                        onClick={submit}
                                        disabled={processing}
                                        className="cursor-pointer"
                                    >
                                        {processing
                                            ? 'Guardando...'
                                            : 'Sí, reemplazar'}
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {recentlySuccessful && (
                        <p className="text-sm text-neutral-600">
                            Firma(s) actualizada(s) correctamente.
                        </p>
                    )}
                </div>
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
    onChange,
}: {
    firmaKey: FirmaKey;
    inputRef: React.RefObject<HTMLInputElement | null>;
    label: string;
    info: FirmaInfo;
    preview: string | null;
    error?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    // La ruta real es /settings/firmas/{tipo}/preview (segmento de ruta,
    // no query string), y {tipo} debe ser exactamente 'firma1' o 'firma2'
    // tal como lo espera FirmaController::show().
    const currentUrl = info.exists
        ? `/settings/firmas/${firmaKey}/preview?v=${info.updated_at}`
        : null;

    const triggerFileSelect = () => {
        inputRef.current?.click();
    };

    return (
        <div className="grid gap-2">
            <Label>{label}</Label>

            <div className="flex items-center gap-4">
                <div className="flex h-16 w-32 shrink-0 items-center justify-center rounded-md border bg-white overflow-hidden">
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

                <button
                    type="button"
                    onClick={triggerFileSelect}
                    className="px-3 py-1.5 text-sm font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-md transition cursor-pointer inline-flex items-center gap-2"
                >
                    <Upload className="h-3.5 w-3.5" />
                    Seleccionar imagen
                </button>

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
    );
}