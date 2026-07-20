import { Form, Head, Link, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import { useState } from 'react';
import { Pencil, X, Check} from 'lucide-react';
import { UpdateAvatarForm } from '@/components/update-avatar-form';

const translate = (key:string, message:string)=>{
    if(key === 'name'){
        if(message === 'The name field must not be greater than 255 characters.'){
            return 'El campo del nombre no debe tener más de 255 caracteres.';
        }else if(message === 'The name field must be at least 2 characters.'){
            return 'El nombre debe tener al menos 2 caracteres.';
        }else if(message === 'The name field format is invalid.'){
            return 'El nombre solo puede contener letras, espacios y guiones.';
        }
    }else if(key === 'email'){
        if(message === 'The email field must be a valid email address.'){
            return 'Introduce un correo electrónico válido (ej. usuario@dominio.com)';
        }
    }
}

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;
    const [isEditing, setIsEditing] = useState(false);

    return (
        <>
            <Head title="Configuracion" />

            <h1 className="sr-only">Configuracion del perfil</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Informacion del perfil"
                    description="Actualiza tu nombre y direccion de correo electronico"
                />

                <UpdateAvatarForm user={auth.user}/>

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    onSuccess={() => setIsEditing(false)}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                               
                                <Label htmlFor="name">Nombre</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                    disabled = {!isEditing}
                                />

                                <InputError
                                    className="mt-2"
                                    message={translate('name',errors.name)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Direccion de correo electronico</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="Correo electronico"
                                    disabled = {!isEditing}
                                />

                                <InputError
                                    className="mt-2"
                                    message={translate('email', errors.email)}
                                />
                            </div>

                            {mustVerifyEmail ||
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            Tu direccion de correo electronico no está verificado.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                Click aqui para enviar la verificacion de correo.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                Se ha enviado un nuevo enlace de verificacion
                                                a su direccion de correo electronico.
                                            </div>
                                        )}
                                    </div>
                                )
                            }

                            <div className="flex w-full h-fit justify-end">    
                                {!isEditing ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="cursor-pointer"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                        Actualizar Perfil
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <Button
                                            className="cursor-pointer"
                                            disabled={processing}
                                            data-test="update-profile-button"
                                        >
                                            <Check className="h-3.5 w-3.5" />
                                            Guardar
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="cursor-pointer"
                                            disabled={processing}
                                            onClick={() => setIsEditing(false)}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                            Cancelar
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Configuracion del perfil',
            href: edit(),
        },
    ],
};
