<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Database\Seeders\RoleSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Anthony Medina',
            'email' => 'testfirst@gmail.com',
            'password' => '123456ml'
        ]);

    
        $this->call([
            RoleSeeder::class
        ]);
        
    }
}
