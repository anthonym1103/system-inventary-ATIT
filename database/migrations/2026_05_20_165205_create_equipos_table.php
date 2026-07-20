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

    /*
    onDelete('cascade') peligroso: en equipos.ubicacion_id y equipos.asignado_id (y telefonos.asignado), 
    si borras una Ubicacion o un UserAsignado se borran en cascada todos los equipos asociados. 
    Probablemente quieras nullOnDelete() para desasignar en vez de perder el equipo. 
    Lo mismo con historial_equipos.usuario_id (perderías la bitácora si se borra el usuario).
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
            $table->text('detalle')->nullable();
            $table->timestamps();

            $table->index(['area', 'tipo', 'condicion', 'ubicacion_id', 'serial', 'marca', 'modelo']);
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
