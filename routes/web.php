<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EquipoController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/profile/avatar',[ProfileController::class, 'updateAvatar']);
    Route::resource('equipos', EquipoController::class);
    Route::get('equipos/{equipo}/edit-data', [EquipoController::class, 'editData'])->name('equipos.edit-data');
});

require __DIR__.'/settings.php';
