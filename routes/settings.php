<?php

use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Settings\FirmaController;
use App\Http\Controllers\Settings\SustitucionController;



Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::get('settings/sustitucion', [SustitucionController::class, 'edit'])->name('sustitucion.edit');
    Route::post('settings/sustitucion', [SustitucionController::class, 'generate'])->name('sustitucion.generate');
    Route::get('settings/firmas', [FirmaController::class, 'edit'])->name('firmas.edit');
    Route::post('settings/firmas', [FirmaController::class, 'update'])->name('firmas.update');
    Route::get('settings/firmas/{tipo}/preview', [FirmaController::class, 'show'])
        ->whereIn('tipo', ['firma1', 'firma2'])
        ->name('firmas.show');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');
});
