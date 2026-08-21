<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Enums\Cargo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class FirmaController extends Controller
{
    private const FIRMAS = [
        'firma1' => 'roman2.png',
        'firma2' => 'roman.png',
    ];

    private const NOMBRES_FILE = 'firmas_nombres.json';

    public function edit(): InertiaResponse
    {
        abort_unless(Auth::user()->hasRole(Cargo::ADMINISTRADOR->value), 403);

        $nombres = $this->getNombres();

        $firmas = [];
        foreach (self::FIRMAS as $key => $filename) {
            $path = storage_path("app/firmas/{$filename}");
            $firmas[$key] = [
                'exists'     => file_exists($path),
                'updated_at' => file_exists($path) ? filemtime($path) : null,
                'nombre'     => $nombres[$key] ?? '',
                'area'       => $nombres["area_{$key}"] ?? '',
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
            'nombre1' => ['nullable', 'string', 'max:255'],
            'nombre2' => ['nullable', 'string', 'max:255'],
            'area1' => ['nullable', 'string', 'max:255'],
            'area2' => ['nullable', 'string', 'max:255'],
        ]);

        $hayArchivo = !empty($validated['firma1'] ?? null) || !empty($validated['firma2'] ?? null);
        $hayNombre = $request->has('nombre1') || $request->has('nombre2')
            || $request->has('area1') || $request->has('area2');

        if (! $hayArchivo && ! $hayNombre) {
            return back()->withErrors([
                'firma1' => 'Debes seleccionar al menos una firma o modificar un nombre.',
            ]);
        }

        $dir = storage_path('app/firmas');
        if (! File::isDirectory($dir)) {
            File::makeDirectory($dir, 0755, true);
        }

        foreach (self::FIRMAS as $key => $filename) {
            if ($request->hasFile($key)) {
                $request->file($key)->move($dir, $filename);
            }
        }

        // Guardar nombres (solo si vinieron en el request)
        $nombres = $this->getNombres();
        if ($request->has('nombre1')) $nombres['firma1'] = $request->input('nombre1', '');
        if ($request->has('nombre2')) $nombres['firma2'] = $request->input('nombre2', '');
        if ($request->has('area1')) $nombres['area_firma1'] = $request->input('area1', '');
        if ($request->has('area2')) $nombres['area_firma2'] = $request->input('area2', '');
        $this->saveNombres($nombres);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Firma(s) actualizada(s) correctamente.']);

        return back();
    }

    public function destroy(string $tipo): SymfonyResponse
    {
        abort_unless(Auth::user()->hasRole(Cargo::ADMINISTRADOR->value), 403);
        abort_unless(array_key_exists($tipo, self::FIRMAS), 404);

        $filename = self::FIRMAS[$tipo];
        $path = storage_path("app/firmas/{$filename}");

        if (file_exists($path)) {
            File::delete($path);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Firma(s) actualizada(s) correctamente.']);

        return back();
    }

    public function show(string $tipo): SymfonyResponse
    {
        abort_unless(array_key_exists($tipo, self::FIRMAS), 404);

        $path = storage_path('app/firmas/' . self::FIRMAS[$tipo]);
        abort_unless(file_exists($path), 404);

        return response()->file($path, ['Cache-Control' => 'no-store']);
    }

    // --- Helpers para los nombres asociados a cada firma ---

    private function getNombres(): array
    {
        $path = storage_path('app/firmas/' . self::NOMBRES_FILE);

        if (! file_exists($path)) {
            return ['firma1' => '', 'firma2' => '', 'area_firma1' => '', 'area_firma2' => ''];
        }

        $data = json_decode(File::get($path), true);

        return is_array($data) ? $data : ['firma1' => '', 'firma2' => '', 'area_firma1' => '', 'area_firma2' => ''];
    }

    private function saveNombres(array $nombres): void
    {
        $dir = storage_path('app/firmas');
        if (! File::isDirectory($dir)) {
            File::makeDirectory($dir, 0755, true);
        }

        File::put(
            $dir . '/' . self::NOMBRES_FILE,
            json_encode($nombres, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );
    }

    // Expuesto para que EquipoController pueda leer los nombres al generar el PDF
    public static function nombreDe(string $key): string
    {
        $path = storage_path('app/firmas/' . self::NOMBRES_FILE);

        if (! file_exists($path)) {
            return '';
        }

        $data = json_decode(File::get($path), true);

        return $data[$key] ?? '';
    }

    public static function areaDe(string $key): string
    {
        $path = storage_path('app/firmas/' . self::NOMBRES_FILE);

        if (! file_exists($path)) {
            return '';
        }

        $data = json_decode(File::get($path), true);

        return $data["area_{$key}"] ?? '';
    }
}