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
            $table->string('anio')->nullable();
            $table->string('ram')->nullable();
            $table->string('disco')->nullable();
            $table->string('direccion_mac')->nullable();
            $table->string('sistema_operativo')->nullable();
            $table->string('dominio')->nullable();
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
