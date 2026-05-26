<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\Settings\ProfileController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::post('/profile/avatar',[ProfileController::class, 'updateAvatar']);
    Route::resource('equipos', EquipoController::class);
});

require __DIR__.'/settings.php';
