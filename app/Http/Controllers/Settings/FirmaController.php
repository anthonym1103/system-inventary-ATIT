<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Enums\Cargo;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class FirmaController extends Controller
{
    // clave usada en el formulario => nombre físico fijo que ya usa el PDF
    private const FIRMAS = [
        'firma1' => 'roman2.png', // firma izquierda
        'firma2' => 'roman.png',  // firma derecha
    ];

    public function edit(): InertiaResponse
    {
        abort_unless(Auth::user()->hasRole(Cargo::ADMINISTRADOR->value), 403);

        $firmas = [];
        foreach (self::FIRMAS as $key => $filename) {
            $path = storage_path("app/firmas/{$filename}");
            $firmas[$key] = [
                'exists'     => file_exists($path),
                'updated_at' => file_exists($path) ? filemtime($path) : null,
            ];
        }

        return Inertia::render('settings/firmas', [
            'firmas' => $firmas,
        ]);
    }

    public function update(Request $request)
    {
        abort_unless(Auth::user()->hasRole(Cargo::ADMINISTRADOR->value), 403);

        $validated = $request->validate([
            'firma1' => ['nullable', 'image', 'mimes:png', 'max:1024'],
            'firma2' => ['nullable', 'image', 'mimes:png', 'max:1024'],
        ]);

        if (empty($validated['firma1'] ?? null) && empty($validated['firma2'] ?? null)) {
            return back()->withErrors([
                'firma1' => 'Debes seleccionar al menos una firma para actualizar.',
            ]);
        }

        $dir = storage_path('app/firmas');
        if (! File::isDirectory($dir)) {
            File::makeDirectory($dir, 0755, true);
        }

        foreach (self::FIRMAS as $key => $filename) {
            if ($request->hasFile($key)) {
                // move() sobrescribe el archivo existente, sin tocar la BD
                $request->file($key)->move($dir, $filename);
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Firma(s) actualizada(s) correctamente.']);

        return back();
    }

    // Sirve la imagen para poder previsualizarla en el frontend
    // (storage/app no es público, así que no hay URL directa)
    public function show(string $tipo): Response
    {
        abort_unless(array_key_exists($tipo, self::FIRMAS), 404);

        $path = storage_path('app/firmas/' . self::FIRMAS[$tipo]);
        abort_unless(file_exists($path), 404);

        return response()->file($path, ['Cache-Control' => 'no-store']);
    }
}