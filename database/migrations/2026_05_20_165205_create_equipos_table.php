<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\CondicionEquipo;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('equipos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ubicacion_id')->constrained('ubicacions')->onDelete('cascade');
            $table->string('asignado_id')->nullable();
            $table->foreign('asignado_id')->references('cedula')->on('user_asignados')->onDelete('cascade');
            $table->string('area');
            $table->string('tipo');
            $table->string('condicion')->default(CondicionEquipo::OPERATIVO->value);
            $table->string('marca')->nullable();
            $table->string('modelo');
            $table->string('serial')->unique();
            $table->string('detalle')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipos');
    }
};
