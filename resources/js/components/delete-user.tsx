import { Form } from '@inertiajs/react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
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

const translate = (key:string, message:string)=>{

    if(key === 'password' && message === 'The password is incorrect.'){
        return 'La contraseña es incorrecta.';
    }
    return message;
}
export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title="Eliminar cuenta"
                description="Elimina tu cuenta y todos sus recursos."
            />
            <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                    <p className="font-medium">¡ADVERTENCIA!</p>
                    <p className="text-sm">
                        Porfavor proceda con precaucion, esto no se puede deshacer.
                    </p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="destructive"
                            className="cursor-pointer"
                            data-test="delete-user-button"
                        >
                            Eliminar cuenta
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>
                            ¿Estas seguro de que quieres eliminar tu cuenta?
                        </DialogTitle>
                        <DialogDescription>
                            Una vez eliminada tu cuenta, todos sus recursos y datos
                            tambien se eliminaran. Porfavor introduce tu contraseña para
                            confirmar que deseas eliminar tu cuenta de forma permanente.
                        </DialogDescription>

                        <Form
                            {...ProfileController.destroy.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            onError={() => passwordInput.current?.focus()}
                            resetOnSuccess
                            className="space-y-6"
                        >
                            {({ resetAndClearErrors, processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="password"
                                            className="sr-only"
                                        >
                                            Contraseña
                                        </Label>

                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            ref={passwordInput}
                                            placeholder="Contraseña..."
                                            autoComplete="current-password"
                                        />

                                        <InputError message={translate('password',errors.password)} />
                                    </div>

                                    <DialogFooter className="gap-2">
                                        <DialogClose asChild>
                                            <Button
                                                variant="secondary"
                                                className="cursor-pointer"
                                                onClick={() =>
                                                    resetAndClearErrors()
                                                }
                                            >
                                                Cancelar
                                            </Button>
                                        </DialogClose>

                                        <Button
                                            variant="destructive"
                                            disabled={processing}
                                            asChild
                                        >
                                            <button
                                                type="submit"
                                                className="cursor-pointer"
                                                data-test="confirm-delete-user-button"
                                            >
                                                Eliminar cuenta
                                            </button>
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
