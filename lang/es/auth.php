<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Authentication Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines are used during authentication for various
    | messages that we need to display to the user. You are free to modify
    | these language lines according to your application's requirements.
    |
    */

    'failed' => 'Estas credenciales no coinciden con nuestros registros. Verifique usuario o contraseña',
    'password' => 'La contraseña ingresada no es correcta.',
    'throttle' => 'Demasiados intentos de inicio de sesión. Vuelva a intentarlo en :seconds segundos.',

    /*
    |--------------------------------------------------------------------------
    | Additional lines for Fortify
    |--------------------------------------------------------------------------
    */

    'two_factor' => [
        'code' => 'El código de autenticación de dos factores no es válido.',
        'recovery' => 'El código de recuperación no es válido.',
    ],
];