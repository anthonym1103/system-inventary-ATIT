import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/password/confirm';

const traslate = (key: string, message:string) => {

    if(key === 'password' && message === 'The provided password was incorrect.'){
        return 'La contraseña ingresada es incorrecta.';
    }
    
    return message;
};

export default function ConfirmPassword() {
    return (
        <>
            <Head title="Configuracion" />

            <Form {...store.form()} resetOnSuccess={['password']}>
                {({ processing, errors }) => (
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                placeholder="Contraseña..."
                                autoComplete="current-password"
                                autoFocus
                            />

                            <InputError message={traslate('password',errors.password)} />
                        </div>

                        <div className="flex items-center">
                            <Button
                                className="w-full"
                                disabled={processing}
                                data-test="confirm-password-button"
                            >
                                {processing && <Spinner />}
                                Confirmar contraseña
                            </Button>
                        </div>
                    </div>
                )}
            </Form>
        </>
    );
}

ConfirmPassword.layout = {
    title: 'Confirme su contraseña',
    description:
        'Esta es un area segura de la aplicacion. Porfavor confirme su contraseña antes de continuar',
};
