<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EquipoController;
use App\Http\Controllers\NotificacionController;
use App\Http\Controllers\HistorialController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Settings\SustitucionController;


Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/profile/avatar',[ProfileController::class, 'updateAvatar']);
    Route::post('equipos/desincorporar', [EquipoController::class, 'desincorporar'])->name('equipos.desincorporar');
    Route::get('equipos/reporte', [EquipoController::class, 'reporte'])->name('equipos.reporte');
    Route::resource('equipos', EquipoController::class);
    Route::get('equipos/{equipo}/edit-data', [EquipoController::class, 'editData'])->name('equipos.edit-data');
    Route::get('sustitucion', [SustitucionController::class, 'edit'])->name('sustitucion.edit');
    Route::post('sustitucion', [SustitucionController::class, 'generate'])->name('sustitucion.generate');
    Route::post('mantenimientos', [NotificacionController::class, 'store'])->name('notificacion.store');
    Route::patch('mantenimientos/{mantenimiento}/leido', [NotificacionController::class, 'markAsRead'])->name('notificacion.leido');
    Route::get('historial', [HistorialController::class, 'index'])->name('historial.index');
    Route::get('usuarios', [UserController::class, 'index'])->name('usuarios.index');
    Route::patch('usuarios/{user}/role', [UserController::class, 'updateRole'])->name('usuarios.update-role');
    Route::delete('mantenimientos/{notificacion}', [NotificacionController::class, 'destroy'])->name('notificacion.destroy');
});

require __DIR__.'/settings.php';
