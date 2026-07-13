import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import AppearanceTabs from '@/components/appearance-tabs';
import AppLogoMiniIcon from '@/components/app-logo-mini-icon';
import { ArrowRight } from 'lucide-react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Bienvenidos" />
            
            <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#FDFDFC] text-[#1b1b18] antialiased transition-colors duration-200 dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
                
                <div className="absolute -right-20 -top-20 pointer-events-none opacity-[0.03] dark:opacity-[0.07] w-[600px] h-[600px] rotate-12 transition-all">
                    <AppLogoMiniIcon className="w-full h-full text-[#d51b18] dark:text-[#ff4d4d]" />
                </div>

                <header className="sticky top-0 z-50 w-full border-b border-[#19140010] bg-[#FDFDFC]/80 backdrop-blur-md dark:border-[#3E3E3A]/40 dark:bg-[#0a0a0a]/80">
                    <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        
                        <div className="flex items-center gap-3">
                            <div className="flex aspect-square size-9 items-center justify-center rounded-xl p-1.5">
                                <AppLogoMiniIcon className="size-full" />
                            </div>
                            <span className="text-sm font-bold tracking-wide text-primary">
                                ATIT ORINOCO
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:block">
                                <AppearanceTabs />
                            </div>

                            <div className="flex items-center gap-2">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex h-9 items-center justify-center rounded-lg bg-[#1b1b18] px-4 text-sm font-medium text-[#FDFDFC] shadow-xs transition-colors hover:bg-[#1b1b18]/90 dark:bg-[#EDEDEC] dark:text-[#0a0a0a] dark:hover:bg-[#EDEDEC]/90"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={login()}
                                            className="group inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        >
                                            Iniciar Sesión
                                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                        </Link>
                                        {canRegister && (
                                            <Link
                                                href={register()}
                                                className="inline-flex items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            >
                                                Crear cuenta
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </nav>
                </header>

                <main>
                    <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-7xl flex-col items-center justify-center gap-6 px-6 lg:px-8">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Bienvenidos a ATIT ORINOCO
                            </h1>
                            <p className="max-w-[42rem] text-lg text-[#1b1b18]/80 dark:text-[#EDEDEC]/80">
                                Sistema de inventario técnico Corpoelec.
                            </p>
                        </div>
                    </div>
                </main>


                <footer className="w-full border-t border-[#19140010] py-6 text-center text-xs text-[#1b1b18]/50 dark:border-[#3E3E3A]/40 dark:text-[#EDEDEC]/50">
                    <p>&copy; {new Date().getFullYear()} ATIT ORINOCO. Todos los derechos reservados.</p>
                </footer>
            </div>
        </>
    );
}