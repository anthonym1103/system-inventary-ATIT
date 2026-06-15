<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ], $this->messages())->validate();

        return User::create([
            'name' => $input['name'],
            'user_name' => $input['user_name'],
            'area' => $input['area'],
            'email' => $input['email'],
            'password' => $input['password'],
        ]);
   
    }

    protected function messages(): array
    {
        return [
            'name.required' => 'Porfavor, introduce tu nombre.',
            'name.max' => 'El campo del nombre no debe tener más de 255 caracteres.',
            'name.min' => 'El nombre debe tener al menos 2 caracteres.',
            'name.regex' => 'El nombre solo puede contener letras, espacios y guiones.',
            'user_name.required' => 'Debe ingresar un nombre de usuario',
            'user_name.unique' => 'Este nombre de usuario ya esta en uso',
            'user_name.regex' => 'El nombre de usuario debe empezar con letra y solo puede contener letras, números y guión bajo y punto.',
            'user_name.min' => 'El nombre de usuario debe tener al menos 3 caracteres.',
            'email.required' => 'El email es obligatorio, introduce tu correo.',
            'email.unique' => 'El correo electrónico ya ha sido registrado.',
            'email.email' => 'Introduce un correo electrónico válido (ej. usuario@dominio.com).',
            'password.required' => 'Debe ingresar una contraseña.',
            'password.min' => 'El campo de contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'El campo de confirmacion de contraseña no coincide.',
        ];
    }
}
