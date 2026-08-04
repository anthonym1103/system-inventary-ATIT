import { Form, Head, useForm } from '@inertiajs/react';
import { InfoIcon } from 'lucide-react';
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
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

type FirmaInfo = { exists: boolean; updated_at: number | null };

type FirmaFormData = {
    firma1: File | null;
    firma2: File | null;
};

export default function Firmas({
    firmas,
}: {
    firmas: { firma1: FirmaInfo; firma2: FirmaInfo };
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
        key: 'firma1' | 'firma2',
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
            <Head title="Firmas" />
            
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
                        Solo se aceptan imágenes en formato <strong>PNG</strong>,
                        con un peso máximo de 1&nbsp;MB. Otros formatos serán
                        rechazados automáticamente.
                    </AlertDescription>
                </Alert>

                <div className="space-y-6">
                    <FirmaField
                        inputRef={input1}
                        label="Firma 1 (izquierda)"
                        info={firmas.firma1}
                        preview={preview1}
                        error={errors.firma1}
                        onChange={handleFileChange('firma1', setPreview1)}
                    />
                    <FirmaField
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
                            <Button disabled={!hasChanges || processing}>
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
                                    <Button variant="secondary">
                                        Cancelar
                                    </Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button
                                        onClick={submit}
                                        disabled={processing}
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
    inputRef,
    label,
    info,
    preview,
    error,
    onChange,
}: {
    inputRef: React.RefObject<HTMLInputElement | null>;
    label: string;
    info: FirmaInfo;
    preview: string | null;
    error?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    const currentUrl = info.exists
        ? `/settings/firmas/preview?v=${info.updated_at}&which=${label}`
        : null;

    return (
        <div className="grid gap-2">
            <Label>{label}</Label>

            <div className="flex items-center gap-4">
                <div className="flex h-16 w-32 shrink-0 items-center justify-center rounded-md border bg-white">
                    {preview ? (
                        <img
                            src={preview}
                            alt={label}
                            className="max-h-full max-w-full"
                        />
                    ) : currentUrl ? (
                        <img
                            src={currentUrl}
                            alt={label}
                            className="max-h-full max-w-full"
                        />
                    ) : (
                        <span className="text-xs text-neutral-400">Sin firma</span>
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/png,.png"
                    className="text-sm"
                    onChange={onChange}
                />
            </div>

            <InputError message={error} />
        </div>
    );
}