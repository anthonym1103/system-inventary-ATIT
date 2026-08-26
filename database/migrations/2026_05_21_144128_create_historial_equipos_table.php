<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('historial_equipos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('equipo_id')->nullable()->constrained('equipos')->nullOnDelete();
            $table->string('equipo_area')->nullable();
            $table->string('equipo_serial')->nullable();
            $table->string('equipo_tipo')->nullable();
            $table->string('numero_inventario')->nullable();
            $table->text('detalle')->nullable();
            $table->dateTime('fecha_ajuste');
            $table->timestamps();

            $table->index(['usuario_id', 'equipo_id', 'fecha_ajuste']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('historial_equipos');
    }
};
