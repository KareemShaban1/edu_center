<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesPlatformApiContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class PlatformUsersApiController extends Controller
{
    use ResolvesPlatformApiContext;
    public function index(Request $request): JsonResponse
    {
$ctx = $this->resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        if (!Schema::connection($conn)->hasTable('admins')) return response()->json([]);
        $users = DB::connection($conn)->table('admins')
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
        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
$ctx = $this->resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        if (!Schema::connection($conn)->hasTable('admins')) return response()->json(['message' => 'Module unavailable'], 422);
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:' . $conn . '.admins,email'],
            'password' => ['nullable', 'string', 'min:6', 'max:100'],
            'role' => ['nullable', 'string'],
        ]);
        DB::connection($conn)->table('admins')->insert([
            'name' => $payload['name'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password'] ?? '123456'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return response()->json(['ok' => true]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
$ctx = $this->resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        if (!Schema::connection($conn)->hasTable('admins')) return response()->json(['message' => 'Module unavailable'], 422);
        $exists = DB::connection($conn)->table('admins')->where('id', $id)->exists();
        if (!$exists) return response()->json(['message' => 'User not found'], 404);
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:' . $conn . '.admins,email,' . $id],
            'password' => ['nullable', 'string', 'min:6', 'max:100'],
            'role' => ['nullable', 'string'],
        ]);
        $update = [
            'name' => $payload['name'],
            'email' => $payload['email'],
            'updated_at' => now(),
        ];
        if (!empty($payload['password'])) $update['password'] = Hash::make($payload['password']);
        DB::connection($conn)->table('admins')->where('id', $id)->update($update);
        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
$ctx = $this->resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        if (!Schema::connection($conn)->hasTable('admins')) return response()->json(['message' => 'Module unavailable'], 422);
        DB::connection($conn)->table('admins')->where('id', $id)->delete();
        return response()->json(['ok' => true]);
    }

}
