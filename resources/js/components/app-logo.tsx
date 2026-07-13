import AppLogoMiniIcon from '@/components/app-logo-mini-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md">
                <AppLogoMiniIcon className="size-5" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 mt-1 truncate leading-tight font-semibold ">
                    ATIT ORINOCO
                </span>
            </div>
        </>
    );
}
