<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
       return [
            'name' => $this->nameRules(),
            'email' => $this->emailRules($this->user()->id),
        ];
    }

     /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Porfavor, introduce tu nombre.',
            'name.min' => 'El nombre debe tener al menos 2 caracteres.',
            'name.max' => 'El campo del nombre no debe tener más de 255 caracteres.',
            'name.regex' => 'El nombre solo puede contener letras, espacios y guiones.',
            'email.required' => 'El email es obligatorio, introduce tu correo.',
            'email.email' => 'Introduce un correo electrónico válido (ej. usuario@dominio.com).',
            'email.unique' => 'El correo electrónico ya ha sido registrado.',
        ];
    }
}
