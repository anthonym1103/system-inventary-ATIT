import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';

export interface EquipoExtraInput {
    tipo: string;
    marca: string;
    modelo: string;
    serial: string;
}

export interface PerifericoInput {
    tipo: string;
    marca: string;
    modelo: string;
    serial: string;
    caracteristicas: string;
}

let uidCounter = 0;
const nextId = () => `row-${++uidCounter}`;

interface EquipoExtraRow extends EquipoExtraInput {
    id: string;
}
interface PerifericoRow extends PerifericoInput {
    id: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (
        motivo: string,
        para: string,
        de: string,
        numero: string,
        equiposExtra: EquipoExtraInput[],
        perifericos: PerifericoInput[],
    ) => void;
    count: number;
    processing?: boolean;
}

export function EquipoDesincorporarDialog({
    isOpen,
    onClose,
    onConfirm,
    count,
    processing = false,
}: Props) {
    const [motivo, setMotivo] = useState('');
    const [para, setPara] = useState('');
    const [de, setDe] = useState('');
    const [numero, setNumero] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [equiposExtra, setEquiposExtra] = useState<EquipoExtraRow[]>([]);
    const [perifericos, setPerifericos] = useState<PerifericoRow[]>([]);

    const resetAll = () => {
        setMotivo('');
        setPara('');
        setDe('');
        setNumero('');
        setError(null);
        setEquiposExtra([]);
        setPerifericos([]);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetAll();
            onClose();
        }
    };

    const addEquipoExtra = () => {
        setEquiposExtra((prev) => [
            ...prev,
            { id: nextId(), tipo: '', marca: '', modelo: '', serial: '' },
        ]);
    };

    const updateEquipoExtra = (id: string, campo: keyof EquipoExtraInput, valor: string) => {
        setEquiposExtra((prev) =>
            prev.map((row) => (row.id === id ? { ...row, [campo]: valor } : row)),
        );
    };

    const removeEquipoExtra = (id: string) => {
        setEquiposExtra((prev) => prev.filter((row) => row.id !== id));
    };

    const addPeriferico = () => {
        setPerifericos((prev) => [
            ...prev,
            { id: nextId(), tipo: '', marca: '', modelo: '', serial: '', caracteristicas: '' },
        ]);
    };

    const updatePeriferico = (id: string, campo: keyof PerifericoInput, valor: string) => {
        setPerifericos((prev) =>
            prev.map((row) => (row.id === id ? { ...row, [campo]: valor } : row)),
        );
    };

    const removePeriferico = (id: string) => {
        setPerifericos((prev) => prev.filter((row) => row.id !== id));
    };

    const handleConfirm = () => {
        if (!motivo.trim()) {
            setError('Debe indicar el motivo de la desincorporación.');
            return;
        }

        if (!para.trim() || !de.trim() || !numero.trim()) {
            setError('Complete los campos Para, De y Número.');
            return;
        }

        const equiposIncompletos = equiposExtra.some(
            (e) => !e.tipo.trim() || !e.modelo.trim(),
        );
        if (equiposIncompletos) {
            setError('Complete el tipo y modelo de todos los equipos no registrados agregados.');
            return;
        }

        const perifericosIncompletos = perifericos.some((p) => !p.tipo.trim());
        if (perifericosIncompletos) {
            setError('Indique el nombre de todos los equipos adicionales / periféricos agregados.');
            return;
        }

        if (count === 0 && equiposExtra.length === 0 && perifericos.length === 0) {
            setError('Debe seleccionar o agregar al menos un equipo o periférico.');
            return;
        }

        onConfirm(
            motivo.trim(),
            para.trim(),
            de.trim(),
            numero.trim(),
            equiposExtra.map(({ id, ...rest }) => rest),
            perifericos.map(({ id, ...rest }) => rest),
        );
    };

    const totalItems = count + equiposExtra.length + perifericos.length;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto [&>button]:cursor-pointer">
                <DialogHeader className="flex items-center">
                    <DialogTitle>Motivo de la desincorporación</DialogTitle>
                    <DialogDescription>
                        Vas a desincorporar {totalItems} elemento(s) en total.
                    </DialogDescription>
                </DialogHeader>

                {/* Datos del oficio */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="grid gap-2">
                        <Label htmlFor="para" className="w-full select-text cursor-text">
                            Para
                        </Label>
                        <Input
                            id="para"
                            value={para}
                            onChange={(e) => {
                                setPara(e.target.value);
                                if (error) setError(null);
                            }}
                            placeholder="Ej. CN. Carlos Suarez..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="de" className="w-full select-text cursor-text">
                            De
                        </Label>
                        <Input
                            id="de"
                            value={de}
                            onChange={(e) => {
                                setDe(e.target.value);
                                if (error) setError(null);
                            }}
                            placeholder="Ej. Ing. Juan Perez..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="numero" className="w-full select-text cursor-text">
                            Número
                        </Label>
                        <Input
                            id="numero"
                            value={numero}
                            onChange={(e) => {
                                setNumero(e.target.value);
                                if (error) setError(null);
                            }}
                            placeholder="Ej. ATIT-RGY 103/2026"
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="motivo" className="w-full select-text cursor-text">
                        Explicación breve del motivo
                    </Label>
                    <textarea
                        id="motivo"
                        className="border-input flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        value={motivo}
                        onChange={(e) => {
                            setMotivo(e.target.value);
                            if (error) setError(null);
                        }}
                        placeholder="Ej. Equipos obsoletos, dañados, fuera de uso..."
                    />
                </div>

                <Separator />

                {/* Equipos no registrados en el sistema */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                            Equipos no registrados en el sistema
                        </Label>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="cursor-pointer"
                            onClick={addEquipoExtra}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Agregar equipo
                        </Button>
                    </div>

                    {equiposExtra.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                            Agrega aquí equipos que se van a desincorporar pero que no están
                            registrados en el inventario.
                        </p>
                    )}

                    {equiposExtra.map((row) => (
                        <div
                            key={row.id}
                            className="grid grid-cols-1 sm:grid-cols-5 gap-2 rounded-lg border p-3"
                        >
                            <Input
                                placeholder="Tipo (Ej. CPU, Impresora...)"
                                value={row.tipo}
                                onChange={(e) => updateEquipoExtra(row.id, 'tipo', e.target.value)}
                                className="sm:col-span-2"
                            />
                            <Input
                                placeholder="Marca"
                                value={row.marca}
                                onChange={(e) => updateEquipoExtra(row.id, 'marca', e.target.value)}
                            />
                            <Input
                                placeholder="Modelo"
                                value={row.modelo}
                                onChange={(e) => updateEquipoExtra(row.id, 'modelo', e.target.value)}
                            />
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Serial"
                                    value={row.serial}
                                    onChange={(e) => updateEquipoExtra(row.id, 'serial', e.target.value)}
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="destructiveNotification"
                                    className="cursor-pointer shrink-0"
                                    onClick={() => removeEquipoExtra(row.id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <Separator />

                {/* Periféricos / equipos adicionales */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                            Equipos adicionales / periféricos
                        </Label>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="cursor-pointer"
                            onClick={addPeriferico}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Agregar
                        </Button>
                    </div>

                    {perifericos.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                            Agrega uno o varios equipos adicionales (teclado, mouse, monitor, etc.).
                        </p>
                    )}

                    {perifericos.map((row) => (
                        <div
                            key={row.id}
                            className="grid grid-cols-1 sm:grid-cols-6 gap-2 rounded-lg border p-3"
                        >
                            <Input
                                placeholder="Nombre (Ej. Teclado, Mouse...)"
                                value={row.tipo}
                                onChange={(e) => updatePeriferico(row.id, 'tipo', e.target.value)}
                            />
                            <Input
                                placeholder="Marca"
                                value={row.marca}
                                onChange={(e) => updatePeriferico(row.id, 'marca', e.target.value)}
                            />
                            <Input
                                placeholder="Modelo"
                                value={row.modelo}
                                onChange={(e) => updatePeriferico(row.id, 'modelo', e.target.value)}
                            />
                            <Input
                                placeholder="Serial"
                                value={row.serial}
                                onChange={(e) => updatePeriferico(row.id, 'serial', e.target.value)}
                            />
                            <Input
                                placeholder="Características"
                                value={row.caracteristicas}
                                onChange={(e) =>
                                    updatePeriferico(row.id, 'caracteristicas', e.target.value)
                                }
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="destructiveNotification"
                                className="cursor-pointer shrink-0"
                                onClick={() => removePeriferico(row.id)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ))}
                </div>

                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                <DialogFooter>
                    <Button
                        type="button"
                        className="cursor-pointer"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={processing}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        className="cursor-pointer"
                        variant="destructiveNotification"
                        onClick={handleConfirm}
                        disabled={processing}
                    >
                        {processing && <Spinner />}
                        Generar y desincorporar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}