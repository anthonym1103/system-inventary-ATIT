import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import AppearanceTabs from '@/components/appearance-tabs';
import AppLogoMiniIcon from '@/components/app-logo-mini-icon';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
                            <span className="text-sm font-bold tracking-wide text-primary select-none">
                                ATIT ORINOCO
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:block">
                                <AppearanceTabs />
                            </div>

                            <div className="flex items-center gap-2">
                                {auth.user && (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex h-9 items-center justify-center rounded-lg bg-[#1b1b18] px-4 text-sm font-medium text-[#FDFDFC] shadow-xs transition-colors hover:bg-[#1b1b18]/90 dark:bg-[#EDEDEC] dark:text-[#0a0a0a] dark:hover:bg-[#EDEDEC]/90"
                                    >
                                        Dashboard
                                    </Link>
                                ) }
                            </div>
                        </div>
                    </nav>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                    <div className="max-w-4xl text-center space-y-6">
                        <div className="flex justify-center mb-4">
                            
                        </div>
                        
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
                            Sistema de Gestion de inventario
                            <span className="block text-primary mt-2">ATIT ORINOCO</span>
                        </h1>
                        
                        <div className="flex flex-wrap justify-center gap-4 pt-6">
                            {!auth.user && (
                                <>
                                    <Button asChild size="lg" variant="default">
                                        <Link href={login()}>
                                            Iniciar Sesión
                                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                        </Link>
                                    </Button>
                                    {canRegister && (
                                        <Button asChild size="lg" variant="outline">
                                            <Link href={register()}>Solicitar Cuenta</Link>
                                        </Button>
                                    )}
                                </>
                            )}
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