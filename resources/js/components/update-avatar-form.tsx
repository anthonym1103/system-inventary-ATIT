import React, { useRef, useState } from 'react';
import { Form, router } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { Upload, CheckCircle } from 'lucide-react';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function UpdateAvatarForm({ user }: Props) {
    const getInitials = useInitials();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 1. Guardamos el archivo binario real en un useState
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    
    // 2. Guardamos la URL de previsualización
    const [previewUrl, setPreviewUrl] = useState<string | undefined>(user.avatar);

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    return (
        <section className="space-y-6 max-w-xl p-6 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <header>
                <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    Foto de Perfil
                </h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    Actualiza tu avatar para personalizar tu cuenta. Se recomiendan imágenes cuadradas.
                </p>
            </header>

            <Form
                action="/profile/avatar"
                method="post"
                encType='multipart/form-data'
                disableWhileProcessing
                onSuccess={() => {
                    // Limpiamos el estado local al subir con éxito
                    setAvatarFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    router.reload({ only: ['user'] }); // Recargamos solo los datos del usuario para actualizar el avatar sin recargar toda la página
                }}
                className="flex flex-col sm:flex-row items-center gap-6"
            >
                {({ processing, errors, recentlySuccessful }) => (
                    <>
                        {/* Contenedor del Avatar interactivo */}
                        <div className="relative group cursor-pointer" onClick={triggerFileSelect}>
                            <Avatar className="h-24 w-24 overflow-hidden rounded-full border-2 border-neutral-200 dark:border-neutral-700 transition group-hover:opacity-80">
                                <AvatarImage src={previewUrl} alt={user.name} />
                                <AvatarFallback className="text-xl bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                    {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>
                            
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="h-6 w-6 text-white" />
                            </div>
                        </div>

                        {/* Input invisible */}
                        <input
                            id="avatar"
                            name="avatar"
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />

                        <div className="flex-1 space-y-3 w-full text-center sm:text-left">
                            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                <button
                                    type="button"
                                    onClick={triggerFileSelect}
                                    className="cursor-pointer px-3 py-1.5 text-sm font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-md transition"
                                >
                                    Seleccionar imagen
                                </button>

                                {/* Mostramos el botón de guardar si el usuario seleccionó un archivo en el useState */}
                                {avatarFile && (
                                    <Button
                                        type="submit"
                                        className="cursor-pointer bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {processing && <Spinner />}
                                        Guardar cambios
                                    </Button>
                                )}
                            </div>

                            {/* Manejo de errores de tu ecosistema */}
                            <InputError message={errors.avatar} />

                            {recentlySuccessful && (
                                <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1 justify-center sm:justify-start">
                                    <CheckCircle className="h-4 w-4" /> ¡Guardado correctamente!
                                </p>
                            )}
                        </div>
                    </>
                )}
            </Form>
        </section>
    );
}