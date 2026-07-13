import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

const translate = (key: string, message: string) => {

    if (key === 'user_name' && message === 'These credentials do not match our records.'){
        return 'La contraseña o nombre de usuario incorrecto, intentelo de nuevo.';
    }
    return message;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    return (
        <>
            <Head title="Iniciar sesión" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="user_name" className="select-text cursor-text">
                                    Nombre de usuario
                                </Label>
                                <Input
                                    id="user_name"
                                    type="text"
                                    name="user_name"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="user-name"
                                    placeholder="Usuario..."
                                />
                                <InputError message={translate('user_name', errors.user_name)} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password" className="select-text cursor-text">Contraseña</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            ¿Has olvidado tu contraseña?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Contraseña"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    className="rounded border-border text-primary focus:ring-ring focus:ring-offset-background cursor-pointer"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember" className="select-none cursor-pointer max-w-fit">
                                    Recuerdame
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full cursor-pointer"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Iniciar Sesion
                            </Button>
                        </div>

                        {canRegister && (
                            <div className="text-center text-sm text-muted-foreground">
                                ¿No tienes una cuenta?{' '}
                                <TextLink href={register()} tabIndex={5}>
                                    Registrarse
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Inicia sesion en tu cuenta',
};
