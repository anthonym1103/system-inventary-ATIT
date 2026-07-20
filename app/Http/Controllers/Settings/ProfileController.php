<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Redirect;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Perfil actualizado.')]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        // Eliminar el avatar si existe
        $avatarPath = $user->getRawOriginal('avatar');
        if ($avatarPath && Storage::disk('public')->exists($avatarPath)) {
            Storage::disk('public')->delete($avatarPath);
        }

        Auth::logout();
        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }


    public function updateAvatar(Request $request)
    {
        
        // 1. Validar que sea una imagen válida y no pase de 2MB
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,gif'],
        ]);

        $user = $request->user();
       
       
        // 2. Eliminar el avatar anterior si existe en el disco público
        $oldAvatarPath = $user->getRawOriginal('avatar');
        if ($oldAvatarPath && Storage::disk('public')->exists($oldAvatarPath)) {
            Storage::disk('public')->delete($oldAvatarPath);
        }

        // 3. Guardar el nuevo archivo en la carpeta 'avatars' dentro del disco 'public'
        // Esto genera un nombre único aleatorio automáticamente
        
        $newAvatarPath = $request->file('avatar')->store('avatars', 'public');
        

        // 4. Guardar la ruta en la base de datos
        $user->update([
            'avatar' => $newAvatarPath,
        ]);

        return Redirect::back()->with('success', 'Avatar actualizado con éxito.');
    }
}
