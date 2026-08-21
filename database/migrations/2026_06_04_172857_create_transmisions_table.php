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
        Schema::create('transmisions', function (Blueprint $table) {
            $table->foreignId('id')->primary()->constrained('equipos')->onDelete('cascade');
            $table->string('potencia')->nullable();
            $table->string('rango_frecuencia')->nullable();
            $table->string('unidad_usuario')->nullable();
            $table->string('caracteristicas')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transmisions');
    }
};
