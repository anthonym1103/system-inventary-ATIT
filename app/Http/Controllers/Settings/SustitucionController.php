<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use setasign\Fpdi\Tcpdf\Fpdi as FpdiTcpdf;

class SustitucionController extends Controller
{
    public function edit(): InertiaResponse
    {
        return Inertia::render('replace/sustitucion');
    }

    public function generate(Request $request)
    {
        $validated = $request->validate([
            // Encabezado
            'personal' => ['nullable', 'string', 'max:50'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'nombre_usuario' => ['required', 'string', 'max:255'],
            'cedula' => ['required', 'string', 'max:50'],
            'unidad' => ['nullable', 'string', 'max:255'],
            'ubicacion_fisica' => ['nullable', 'string', 'max:255'],
            'aliado_atit' => ['nullable', 'string', 'max:255'],
            // 'aliado_ext' => ['nullable', 'string', 'max:20'], // TODO: confirmar significado de "Ext"
            'personal_enlace' => ['nullable', 'string', 'max:255'],
            // 'personal_enlace_ext' => ['nullable', 'string', 'max:20'], // TODO: confirmar significado de "Ext"

            // Equipo a entregar
            'entrega_tipo_equipo' => ['required', 'string', 'max:255'],
            'entrega_marca' => ['nullable', 'string', 'max:255'],
            'entrega_modelo' => ['required', 'string', 'max:255'],
            'entrega_microprocesador' => ['nullable', 'string', 'max:255'],
            'entrega_ram' => ['nullable', 'string', 'max:100'],
            'entrega_disco' => ['nullable', 'string', 'max:100'],
            'entrega_disco_unidad' => ['nullable', 'in:GB,TB'],
            'entrega_cpu_serial' => ['required', 'string', 'max:255'],
            'entrega_inmovilizado' => ['nullable', 'string', 'max:100'],

            'monitor_marca' => ['nullable', 'string', 'max:100'],
            'monitor_modelo' => ['nullable', 'string', 'max:100'],
            'monitor_serial' => ['nullable', 'string', 'max:100'],
            'teclado_marca' => ['nullable', 'string', 'max:100'],
            'teclado_modelo' => ['nullable', 'string', 'max:100'],
            'teclado_serial' => ['nullable', 'string', 'max:100'],
            'mouse_marca' => ['nullable', 'string', 'max:100'],
            'mouse_modelo' => ['nullable', 'string', 'max:100'],
            'mouse_serial' => ['nullable', 'string', 'max:100'],
            'regulador_marca' => ['nullable', 'string', 'max:100'],
            'regulador_modelo' => ['nullable', 'string', 'max:100'],
            'regulador_serial' => ['nullable', 'string', 'max:100'],

            'nombre_computador' => ['nullable', 'string', 'max:255'],
            'correo' => ['nullable', 'email', 'max:255'],

            // Software
            'canaima' => ['boolean'],
            'project' => ['boolean'],
            'windows7' => ['boolean'],
            'autocad' => ['boolean'],
            'debian' => ['boolean'],
            'virtualizacion' => ['nullable', 'string', 'max:255'],

            // Equipo a sustituir
            'sustituir_tipo_equipo' => ['required', 'string', 'max:255'],
            'sustituir_marca' => ['nullable', 'string', 'max:255'],
            'sustituir_modelo' => ['required', 'string', 'max:255'],
            'sustituir_microprocesador' => ['nullable', 'string', 'max:255'],
            'sustituir_serial_cpu' => ['required', 'string', 'max:255'],
            'sustituir_ram' => ['nullable', 'string', 'max:100'],
            'sustituir_sistema_operativo' => ['nullable', 'string', 'max:255'],
            'sustituir_inventario' => ['nullable', 'string', 'max:255'],
            'sustituir_nombre_computador' => ['nullable', 'string', 'max:255'],
            'sustituir_disco_capacidad' => ['nullable', 'string', 'max:50'],
            'sustituir_disco_unidad' => ['nullable', 'in:GB,TB'],
        ]);

        // AutoCad 2007 solo puede ir marcado si Windows 7 está marcado
        if (!empty($validated['autocad']) && empty($validated['windows7'])) {
            return back()->withErrors([
                'autocad' => 'Solo puedes marcar AutoCad 2007 si también seleccionas Windows 7.',
            ]);
        }

        try {
            $pdfPath = $this->generarPdfSustitucion($validated);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'No se pudo generar el PDF de la sustitución.',
                'error' => $e->getMessage(),
            ], 500);
        }

        return response()->download($pdfPath)->deleteFileAfterSend(true);
    }

    private function generarPdfSustitucion(array $data): string
    {
        $templatePath = storage_path('app/pdf-templates/sustitucionEquipo.pdf');

        if (! file_exists($templatePath)) {
            throw new \RuntimeException(
                "No se encontró la plantilla PDF en: {$templatePath}. " .
                "Sube el PDF modelo (una sola página, tamaño LETTER) a storage/app/pdf-templates/sustitucionEquipo.pdf"
            );
        }

        $tempDir = 'storage/temp';
        if (! Storage::disk('local')->exists($tempDir)) {
            Storage::disk('local')->makeDirectory($tempDir, 0755, true);
        }

        $fileName = 'sustitucion_' . now()->timestamp . '.pdf';
        $outputPath = Storage::disk('local')->path($tempDir . '/' . $fileName);

        $ptToMm = fn (float $pt): float => $pt * 0.3527778;

        $pdf = new FpdiTcpdf('P', 'mm', 'LETTER', true, 'UTF-8', false);
        $pdf->SetCreator('ATIT ORINOCO');
        $pdf->SetAuthor(auth()->user()?->name ?? 'ATIT ORINOCO');
        $pdf->SetTitle('Sustitución');
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->SetMargins(0, 0, 0);
        $pdf->SetAutoPageBreak(false);

        $pdf->SetTextColor(0, 0, 128);
        $pdf->SetFont('dejavusans', '', 8);

        $pdf->setSourceFile($templatePath);
        $tpl = $pdf->importPage(1);
        $size = $pdf->getTemplateSize($tpl);
        $pdf->AddPage('P', [$size['width'], $size['height']]);
        $pdf->useTemplate($tpl, 0, 0, $size['width'], $size['height']);

        // Escribe el valor justo a la derecha de la etiqueta (coordenadas del .txt, en puntos).
        $write = function (float $labelX, float $labelY, float $labelWidth, ?string $value, float $gap = 4) use ($pdf, $ptToMm) {
            if ($value === null || $value === '') {
                return;
            }

            $pdf->SetXY($ptToMm($labelX + $labelWidth + $gap), $ptToMm($labelY));
            $pdf->Cell(0, 4.5, $value);
        };

        // Marca una "X" a la derecha de la etiqueta/checkbox indicado.
        $mark = function (float $labelX, float $labelY, float $labelWidth, bool $checked, float $gap = 4) use ($write) {
            if ($checked) {
                $write($labelX, $labelY, $labelWidth, 'X', $gap);
            }
        };

        // ---------- Encabezado ----------
        $write(414.62, 46.94, 23.31, now()->format('d/m/Y'));
        $pdf->SetFont('dejavusans', 'B', 10);
        $write(454.71, 81.01, 35.50, $data['entrega_modelo'] ?? null);
        $pdf->SetFont('dejavusans', '', 8);
        $write(344.09, 116.76, 42.45, $data['personal'] ?? null);
        $write(431.90, 116.76, 42.21, $data['telefono'] ?? null);
        $write(82.18, 113.56, 35.71, $data['nombre_usuario'] ?? null);
        $write(277.73, 113.56, 33.82, $data['cedula'] ?? null);
        $write(44.36, 139.24, 34.76, $data['unidad'] ?? null);
        $write(75.09, 160.00, 43.63, $data['ubicacion_fisica'] ?? null);
        $write(65.20, 175.84, 28.18, $data['aliado_atit'] ?? null);
        // $write(166.22, 177.84, 17.63, $data['aliado_ext'] ?? null); // TODO: confirmar "Ext"
        $write(308.20, 175.84, 39.21, $data['personal_enlace'] ?? null);
        // $write(428.47, 177.84, 17.74, $data['personal_enlace_ext'] ?? null); // TODO: confirmar "Ext"


        // ---------- Información del equipo a entregar ----------
        $write(97.60, 207.40, 19.43, $data['entrega_tipo_equipo'] ?? null);
        $write(255.05, 207.40, 30.22, $data['entrega_marca'] ?? null);
        $write(361.87, 207.40, 35.50, $data['entrega_modelo'] ?? null);
        $write(44.36, 223.24, 78.11, $data['entrega_microprocesador'] ?? null);
        $write(387.20, 223.24, 38.96, $data['entrega_ram'] ?? null);

        $capacidadEntrega = $data['entrega_disco'] ?? null;
        if($capacidadEntrega){
            $capacidadEntrega .= ' ' . ($data['entrega_disco_unidad'] ?? 'GB');
        }
        $write(502.63, 223.24, 24.47, $capacidadEntrega ?? null);

        $write(71.90, 242.56, 18.29, $data['entrega_cpu_serial'] ?? null);
        $write(360.31, 242.56, 73.98, $data['entrega_inmovilizado'] ?? null);

        $monitor = $this->formatPeriferico($data, 'monitor');
        $teclado = $this->formatPeriferico($data, 'teclado');
        $mouse = $this->formatPeriferico($data, 'mouse');
        $regulador = $this->formatPeriferico($data, 'regulador');

        $write(168.62, 261.51, 47.11, $monitor);
        $write(163.98, 279.29, 44.59, $teclado);
        $write(166.62, 299.67, 35.11, $mouse);
        $write(170.14, 319.97, 58.73, $regulador);

        $write(109.54, 340.35, 39.07, $data['nombre_computador'] ?? null);
        $write(359.31, 340.35, 40.66, $data['correo'] ?? null);

        // ---------- Software a instalar ----------
        $mark(102.72, 378.07, 43.29, (bool) ($data['canaima'] ?? false));
        $mark(217.10, 378.07, 32.34, (bool) ($data['project'] ?? false));
        $mark(324.01, 378.07, 37.89, (bool) ($data['autocad'] ?? false));
        $mark(497.26, 378.07, 48.40, (bool) ($data['windows7'] ?? false));
        $mark(113.72, 395.03, 31.40, (bool) ($data['debian'] ?? false));
        $write(43.80, 413.35, 65.00, $data['virtualizacion'] ?? null);

        // ---------- Información del equipo a sustituir ----------
        $write(96.61, 448.41, 19.32, $data['sustituir_tipo_equipo'] ?? null);
        $write(251.41, 448.41, 30.22, $data['sustituir_marca'] ?? null);
        $write(358.23, 448.41, 35.50, $data['sustituir_modelo'] ?? null);
        $write(44.04, 462.21, 78.00, $data['sustituir_microprocesador'] ?? null);
        $write(387.01, 462.21, 25.78, $data['sustituir_serial_cpu'] ?? null);
        $write(71.66, 475.89, 38.95, $data['sustituir_ram'] ?? null);
        $write(280.01, 475.89, 35.94, $data['sustituir_sistema_operativo'] ?? null);
        $write(433.71, 475.89, 50.72, $data['sustituir_inventario'] ?? null);
        $write(119.73, 492.01, 35.57, $data['sustituir_nombre_computador'] ?? null);

        $capacidad = $data['sustituir_disco_capacidad'] ?? null;
        if ($capacidad) {
            $capacidad .= ' ' . ($data['sustituir_disco_unidad'] ?? 'GB');
        }
        $write(408.88, 492.01, 37.61, $capacidad);

        // ---------- Componentes a retirar (marcado automático) ----------
        $mark(216.77, 508.45, 18.29, true); // El CPU siempre se retira en una sustitución
        $mark(272.61, 508.45, 34.70, $monitor !== null);
        $mark(344.35, 508.45, 34.76, $teclado !== null);
        $mark(426.35, 508.45, 28.84, $mouse !== null);
        $mark(499.66, 508.45, 46.09, $regulador !== null);

        $pdf->Output($outputPath, 'F');

        return $outputPath;
    }

    private function formatPeriferico(array $data, string $prefix): ?string
    {
        $marca = trim($data["{$prefix}_marca"] ?? '');
        $modelo = trim($data["{$prefix}_modelo"] ?? '');
        $serial = trim($data["{$prefix}_serial"] ?? '');

        if ($marca === '' && $modelo === '' && $serial === '') {
            return null;
        }

        return implode('/', array_filter([$marca, $modelo, $serial], fn ($v) => $v !== ''));
    }
}