// Components
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/routes';
import { email } from '@/routes/password';

const translate = (key: string, message: string) => {
    if (key === 'email'){
        if(message === 'The email field is required.'){
            return 'El campo de correo electronico es requerido.';
        }else if(message === "We can't find a user with that email address."){
            return 'No podemos encontrar ningun usuario con esa direccion de correo electronico'
        }
    }
    return message;
};

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Recuperar contraseña" />

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="space-y-6">
                <Form {...email.form()}>
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="select-text cursor-text">Direccion de correo electronico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="email@example.com"
                                />

                                <InputError message={translate('email',errors.email)} />
                            </div>

                            <div className="my-6 flex items-center justify-start">
                                <Button
                                    className="w-full cursor-pointer"
                                    disabled={processing}
                                    data-test="email-password-reset-link-button"
                                >
                                    {processing && (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    )}
                                    Enviar enlace
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                <div className="space-x-1 text-center text-sm text-muted-foreground">
                    <span>O, regresar a</span>
                    <TextLink href={login()}>Iniciar sesion</TextLink>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Has olvidado tu contraseña',
    description: 'Ingrese su correo electronico se le enviara un enlace para restablecer su contraseña',
};
