<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create superadmin from env config
        User::firstOrCreate(
            ['email' => config('openpapers.admin.email')],
            [
                'full_name' => config('openpapers.admin.name', 'Administrador'),
                'password' => Hash::make(config('openpapers.admin.password', 'Admin123!')),
                'role' => 'superadmin',
                'is_active' => true,
            ]
        );
    }
}
