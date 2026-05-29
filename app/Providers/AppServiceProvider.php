<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();


        VerifyEmail::toMailUsing(function (object $notifiable, string $url) {
        // Puedes personalizar el asunto y el contenido aquí
        $expiration = config('auth.verification.expire', 60);

        return (new MailMessage)
            ->subject('Por favor, verifica tu dirección de correo') // Asunto personalizado
            ->greeting('¡Hola ' . $notifiable->name . '!') // Saludo personalizado
            ->line('Haz clic en el botón de abajo para verificar tu cuenta.')
            ->action('Verificar mi cuenta', $url)
            ->line('Este enlace de verificación expirará en ' . $expiration . ' minutos.')
            ->line('Si no creaste una cuenta en nuestra plataforma, ignora este mensaje.')
            ->salutation('Atentamente, ' . config('app.name'));
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
