import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

interface RegisterProps {
    areaOptions?: Array<{ value: string; label: string }>;
}

export default function Register({ areaOptions = [] }: RegisterProps) {

    const [selectedArea, setSelectedArea] = useState('');

    return (
        <>
            <Head title="Registarse"/>
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors,  }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="select-text cursor-text">Nombre</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Ej. Juan Pérez"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="user_name" className="select-text cursor-text">Nombre de usuario </Label>
                                <Input
                                    id="user_name"
                                    type="text"
                                    required
                                    tabIndex={2}
                                    autoComplete="user_name"
                                    name="user_name"
                                    placeholder="Usuario..."
                                />
                                <InputError
                                    message={errors.user_name}
                                    className="mt-2"
                                />
                            </div>
                            
                            <div className="grid gap-2">
                                <Label htmlFor="area" className="select-text cursor-text">Area</Label>
                                <Select
                                    value={selectedArea}
                                    onValueChange={(value) => setSelectedArea(value)}
                                    required
                                >
                                    <SelectTrigger tabIndex={3} className='w-full'>
                                        <SelectValue placeholder="Selecciona un área" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {areaOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {/* Hidden input para que Inertia envíe el valor */}
                                <Input type="hidden" id="area" name="area" value={selectedArea} />
                                <InputError 
                                    message={errors.area}
                                    className="mt-2"
                                />
                            </div> 

                            <div className="grid gap-2">
                                <Label htmlFor="email" className="select-text cursor-text">Direccion de correo electronico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={4}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/*<div className="grid gap-2">
                                <Label htmlFor="sector">Sector / Rol</Label>
                                <Input
                                    id="sector"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="sector"
                                    name="sector"
                                    placeholder="Seleccione..."
                                />
                                <InputError
                                    message={errors.sector}
                                    className="mt-2"
                                />
                            </div>*/}

                            <div className="grid gap-2">
                                <Label htmlFor="password" className="select-text cursor-text">Contraseña</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={5}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Contraseña..."
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation" className="select-text cursor-text">
                                    Confirmar contraseña
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={6}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirmar Contraseña..."
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full cursor-pointer"
                                tabIndex={7}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Crear Cuenta
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            ¿Ya tienes una cuenta?{' '}
                            <TextLink href={login()} tabIndex={8}>
                                Iniciar sesion
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Crear una cuenta',
    description: 'Ingrese sus datos a continuacion para crear su cuenta',
};
