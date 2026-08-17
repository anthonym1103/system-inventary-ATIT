<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\HistorialEquipo;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use setasign\Fpdi\Tcpdf\Fpdi as FpdiTcpdf;

class SustitucionController extends Controller
{
    public function edit(): InertiaResponse
    {
        return Inertia::render('settings/sustitucion');
    }

    public function generate(Request $request)
    {
        $validated = $request->validate([
            'nuevo_tipo'   => ['required', 'string', 'max:255'],
            'nuevo_marca'  => ['nullable', 'string', 'max:255'],
            'nuevo_modelo' => ['required', 'string', 'max:255'],
            'nuevo_serial' => ['required', 'string', 'max:255'],

            'viejo_tipo'   => ['required', 'string', 'max:255'],
            'viejo_marca'  => ['nullable', 'string', 'max:255'],
            'viejo_modelo' => ['required', 'string', 'max:255'],
            'viejo_serial' => ['required', 'string', 'max:255'],

            'motivo' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();

        try {
            $pdfPath = $this->generarPdfSustitucion($validated, $user);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'No se pudo generar el PDF de sustitución.',
                'error' => $e->getMessage(),
            ], 500);
        }

        HistorialEquipo::create([
            'usuario_id' => $user->id,
            'equipo_id' => null,
            'equipo_area' => $user->area?->value,
            'equipo_tipo' => null,
            'equipo_serial' => $validated['nuevo_serial'] . ' / ' . $validated['viejo_serial'],
            'detalle' => $this->detalleSustitucion($validated),
            'fecha_ajuste' => now(),
        ]);

        return response()->download($pdfPath)->deleteFileAfterSend(true);
    }

    private function detalleSustitucion(array $data): string
    {
        $partes = [
            'Nuevo - Tipo: ' . $data['nuevo_tipo'],
            'Nuevo - Marca: ' . ($data['nuevo_marca'] ?: '—'),
            'Nuevo - Modelo: ' . $data['nuevo_modelo'],
            'Nuevo - Serial nuevo: ' . $data['nuevo_serial'],
            'Viejo - Tipo: ' . $data['viejo_tipo'],
            'Viejo - Marca: ' . ($data['viejo_marca'] ?: '—'),
            'Viejo - Modelo: ' . $data['viejo_modelo'],
            'Viejo - Serial viejo: ' . $data['viejo_serial'],
        ];

        if (!empty($data['motivo'])) {
            $partes[] = 'Motivo: ' . $data['motivo'];
        }

        return 'Sustitución de equipo: ' . implode('; ', $partes);
    }

    private function generarPdfSustitucion(array $data, $user): string
    {
        $templatePath = storage_path('app/pdf-templates/sustitucionEquipo.pdf');

        if (! file_exists($templatePath)) {
            throw new \RuntimeException(
                "No se encontró la plantilla PDF en: {$templatePath}. " .
                "Sube tu PDF modelo (una sola página, tamaño LETTER) a storage/app/pdf-templates/sustitucionEquipo.pdf"
            );
        }

        $tempDir = 'storage/temp';
        if (!Storage::disk('local')->exists($tempDir)) {
            Storage::disk('local')->makeDirectory($tempDir, 0755, true);
        }

        $fileName = 'sustitucion_' . now()->timestamp . '.pdf';
        $outputPath = Storage::disk('local')->path($tempDir . '/' . $fileName);

        $ptToMm = fn (float $pt): float => $pt * 0.3527778;

        $pdf = new FpdiTcpdf('P', 'mm', 'LETTER', true, 'UTF-8', false);
        $pdf->SetCreator('ATIT ORINOCO');
        $pdf->SetAuthor($user->name);
        $pdf->SetTitle('Formato de Sustitución de Equipo');
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->SetMargins(0, 0, 0);
        $pdf->SetAutoPageBreak(false);
        $pdf->SetFont('helvetica', '', 10);

        $pdf->setSourceFile($templatePath);

        // ================== ÚNICA PÁGINA ==================
        $tpl = $pdf->importPage(1);
        $size = $pdf->getTemplateSize($tpl);
        $pdf->AddPage('P', [$size['width'], $size['height']]);
        $pdf->useTemplate($tpl, 0, 0, $size['width'], $size['height']);

        // --- Posiciones arbitrarias (en puntos, igual que en desincorporación) ---
        // Ajustar estos valores cuando se tenga la plantilla real.

        // Equipo nuevo
        $pdf->SetXY($ptToMm(90), $ptToMm(120));
        $pdf->Cell(0, 4.5, $data['nuevo_tipo']);

        $pdf->SetXY($ptToMm(90), $ptToMm(135));
        $pdf->Cell(0, 4.5, $data['nuevo_marca'] ?? '—');

        $pdf->SetXY($ptToMm(90), $ptToMm(150));
        $pdf->Cell(0, 4.5, $data['nuevo_modelo']);

        $pdf->SetXY($ptToMm(90), $ptToMm(165));
        $pdf->Cell(0, 4.5, $data['nuevo_serial']);

        // Equipo a sustituir
        $pdf->SetXY($ptToMm(90), $ptToMm(220));
        $pdf->Cell(0, 4.5, $data['viejo_tipo']);

        $pdf->SetXY($ptToMm(90), $ptToMm(235));
        $pdf->Cell(0, 4.5, $data['viejo_marca'] ?? '—');

        $pdf->SetXY($ptToMm(90), $ptToMm(250));
        $pdf->Cell(0, 4.5, $data['viejo_modelo']);

        $pdf->SetXY($ptToMm(90), $ptToMm(265));
        $pdf->Cell(0, 4.5, $data['viejo_serial']);

        // Motivo
        if (!empty($data['motivo'])) {
            $pdf->SetXY($ptToMm(60), $ptToMm(295));
            $pdf->MultiCell($ptToMm(480), 6, $data['motivo'], 0, 'L');
        }

        // Fecha
        $pdf->SetXY($ptToMm(60), $ptToMm(320));
        $pdf->Cell(0, 4.5, now()->translatedFormat('j \d\e F \d\e\l Y'));

        $pdf->Output($outputPath, 'F');

        return $outputPath;
    }
}