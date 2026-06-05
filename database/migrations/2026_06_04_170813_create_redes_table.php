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
        Schema::create('redes', function (Blueprint $table) {
            $table->foreignId('id')->primary()->constrained('equipos')->onDelete('cascade');
            $table->string('puerto')->nullable();
            $table->string('puerto_fibra')->nullable();
            $table->string('contraseña_bios')->nullable();
            $table->string('direccion_ip')->nullable();
            $table->string('direccion_mac')->nullable();
            $table->string('extension')->nullable();
            $table->string('ubicacion_puerto')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('redes');
    }
};
