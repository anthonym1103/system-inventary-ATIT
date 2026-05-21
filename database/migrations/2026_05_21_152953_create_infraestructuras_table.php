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
        Schema::create('infraestructuras', function (Blueprint $table) {
            $table->foreignId('id')->primary()->constrained('equipos')->onDelete('cascade');
            $table->foreignId('encargado_id')->constrained('encargados')->onDelete('cascade');
            $table->string('año');
            $table->string('ram');
            $table->string('disco');
            $table->string('direccion_mac');
            $table->string('sistema_operativo');
            $table->string('numero_inventario');
            $table->string('dominio');
            $table->string('estado');
            $table->string('unidad');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('infraestructuras');
    }
};
