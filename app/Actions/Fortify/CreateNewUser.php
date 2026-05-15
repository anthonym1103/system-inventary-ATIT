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
            'email' => $input['email'],
            'password' => $input['password'],
        ]);
   
    }

    protected function messages(): array
    {
        return [
            'name.required' => 'Porfavor, introduce tu nombre.',
            'name.max' => 'El campo del nombre no debe tener más de 255 caracteres.',
            'email.required' => 'El email es obligatorio, introduce tu correo.',
            'email.unique' => 'El correo electrónico ya ha sido registrado.',
            'password.required' => 'Debe ingresar una contraseña.',
            'password.min' => 'El campo de contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'El campo de confirmacion de contraseña no coincide.',
        ];
    }
}
