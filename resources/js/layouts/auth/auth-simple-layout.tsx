import { Link } from '@inertiajs/react';
import AppLogoMiniIcon from '@/components/app-logo-mini-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col bg-background">
            {/* Nav superior */}
            <header className="flex items-center justify-between px-6 py-5 lg:px-10">
                <Link href={home()} className="flex items-center gap-2.5">
                    <AppLogoMiniIcon className="h-7 w-7" />
                    <span className="text-sm font-bold tracking-wide text-primary">
                        ATIT ORINOCO
                    </span>
                </Link>
                <span className="hidden font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase sm:block">
                    Inventario técnico · Corpoelec
                </span>
            </header>

            {/* Formulario centrado */}
            <div className="flex flex-1 items-center justify-center px-6 py-10">
                <div className="w-full max-w-[27rem]">
                    <div className="flex flex-col gap-8">
                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                        {children}
                    </div>
                </div>
            </div>

            {/* Footer con acento de marca */}
            <footer className="w-full border-t border-[#19140010] py-6 text-center text-xs text-[#1b1b18]/50 dark:border-[#3E3E3A]/40 dark:text-[#EDEDEC]/50">
                <p>&copy; {new Date().getFullYear()} ATIT ORINOCO. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}