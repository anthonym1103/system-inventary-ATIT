
import { usePage } from '@inertiajs/react';
export default function Index(

){
    const { auth } = usePage().props;

    return(
        <div>
            {auth.user?(
                <h1>Holaa</h1>
            ):(
                <h2>Buenas</h2>
            )}
        </div>
    );
}

Index.layout = {
    breadcrumb: [
        {
            title: 'equipos',
            href: Index(),
        },
    ],
};