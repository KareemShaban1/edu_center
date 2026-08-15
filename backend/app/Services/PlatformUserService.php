<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

final class PlatformUserService
{
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function list(string $conn): Collection
    {
        if (! Schema::connection($conn)->hasTable('admins')) {
            return collect();
        }

        return DB::connection($conn)->table('admins')
            ->orderByDesc('id')
            ->get(['id', 'name', 'email', 'created_at'])
            ->map(function ($row) {
                return [
                    'id' => (int) $row->id,
                    'name' => $row->name,
                    'email' => $row->email,
                    'role' => 'platform_admin',
                    'tenant_id' => null,
                    'tenant_name' => 'Platform',
                    'locale' => 'en',
                    'created_at' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
                    'status' => 'active',
                ];
            })
            ->values();
    }

    public function isAvailable(string $conn): bool
    {
        return Schema::connection($conn)->hasTable('admins');
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function store(string $conn, array $payload): void
    {
        DB::connection($conn)->table('admins')->insert([
            'name' => $payload['name'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password'] ?? '123456'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function update(string $conn, int $id, array $payload): bool
    {
        $exists = DB::connection($conn)->table('admins')->where('id', $id)->exists();
        if (! $exists) {
            return false;
        }

        $update = [
            'name' => $payload['name'],
            'email' => $payload['email'],
            'updated_at' => now(),
        ];
        if (! empty($payload['password'])) {
            $update['password'] = Hash::make($payload['password']);
        }
        DB::connection($conn)->table('admins')->where('id', $id)->update($update);

        return true;
    }

    public function destroy(string $conn, int $id): void
    {
        DB::connection($conn)->table('admins')->where('id', $id)->delete();
    }
}
