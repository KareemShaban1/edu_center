<?php

declare(strict_types=1);

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesCenterApiContext;
use App\Jobs\DeleteCenterData;
use App\Jobs\SetupCenter;
use App\Models\Platform\Center;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class PlatformCenterApiController extends Controller
{
    use ResolvesCenterApiContext;

    protected function denyUnlessPlatform(Request $request): ?JsonResponse
    {
        $guard = $request->session()->get('api_auth_guard', 'platform_admin');
        if ($guard !== 'platform_admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $authUserId = Auth::guard('platform_admin')->id() ?? $request->session()->get('api_auth_user_id');
        if (! $authUserId) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return null;
    }

    public function index(Request $request): JsonResponse
    {
        if ($err = $this->denyUnlessPlatform($request)) {
            return $err;
        }

        $centers = Center::query()->orderByDesc('created_at')->get()->map(function (Center $center) {
            $users_count = 0;
            $teachers_count = 0;
            $students_count = 0;
            $parents_count = 0;

            try {
                $this->ensureCenterInitialized($center);
                $db = DB::connection('center');
                $sch = Schema::connection('center');
                if ($sch->hasTable('users')) {
                    $users_count = (int) $db->table('users')->count();
                }
                if ($sch->hasTable('teachers')) {
                    $teachers_count = (int) $db->table('teachers')->count();
                }
                if ($sch->hasTable('students')) {
                    $students_count = (int) $db->table('students')->count();
                }
                if ($sch->hasTable('parents')) {
                    $parents_count = (int) $db->table('parents')->count();
                }
            } catch (\Throwable) {
                // counts stay zero
            } finally {
                $this->endCenterContext();
            }

            return $this->serializeCenter($center, [
                'users_count' => $users_count,
                'teachers_count' => $teachers_count,
                'students_count' => $students_count,
                'parents_count' => $parents_count,
            ]);
        })->values();

        return response()->json($centers);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        if ($err = $this->denyUnlessPlatform($request)) {
            return $err;
        }

        $center = Center::query()->where('id', $id)->orWhere('slug', $id)->first();
        if (! $center) {
            return response()->json(['message' => 'Center not found'], 404);
        }

        $counts = [
            'users_count' => 0,
            'teachers_count' => 0,
            'students_count' => 0,
            'parents_count' => 0,
        ];

        try {
            $this->ensureCenterInitialized($center);
            $db = DB::connection('center');
            $sch = Schema::connection('center');
            if ($sch->hasTable('users')) {
                $counts['users_count'] = (int) $db->table('users')->count();
            }
            if ($sch->hasTable('teachers')) {
                $counts['teachers_count'] = (int) $db->table('teachers')->count();
            }
            if ($sch->hasTable('students')) {
                $counts['students_count'] = (int) $db->table('students')->count();
            }
            if ($sch->hasTable('parents')) {
                $counts['parents_count'] = (int) $db->table('parents')->count();
            }
        } catch (\Throwable) {
            // counts stay zero
        } finally {
            $this->endCenterContext();
        }

        return response()->json($this->serializeCenter($center, $counts, full: true));
    }

    /**
     * @param  array{users_count: int, teachers_count: int, students_count: int, parents_count: int}  $counts
     * @return array<string, mixed>
     */
    protected function serializeCenter(Center $center, array $counts, bool $full = false): array
    {
        $subscription = data_get($center->data, 'subscription', []);
        if (! is_array($subscription)) {
            $subscription = [];
        }

        $payload = [
            'id' => $center->id,
            'name' => $center->name,
            'domain' => $center->domain ?: ($center->slug ? $center->slug.'.localhost' : ''),
            'slug' => $center->slug,
            'center_slug' => $center->slug,
            'tenant_slug' => $center->slug,
            'plan' => $center->plan(),
            'users_count' => $counts['users_count'],
            'teachers_count' => $counts['teachers_count'],
            'students_count' => $counts['students_count'],
            'parents_count' => $counts['parents_count'],
            'subscription_status' => data_get($subscription, 'status', 'trial'),
            'status' => ((int) $center->status) === 1 ? 'active' : 'inactive',
            'created_at' => optional($center->created_at)->format('Y-m-d') ?? now()->toDateString(),
        ];

        if ($full) {
            $payload = array_merge($payload, [
                'email' => $center->email,
                'phone' => $center->phone,
                'address' => $center->address,
                'city' => $center->city,
                'updated_at' => optional($center->updated_at)->format('Y-m-d H:i') ?? null,
                'subscription' => [
                    'plan' => data_get($subscription, 'plan', $center->plan()),
                    'amount' => data_get($subscription, 'amount', 0),
                    'billing_cycle' => data_get($subscription, 'billing_cycle', 'monthly'),
                    'status' => data_get($subscription, 'status', 'trial'),
                    'next_billing_date' => data_get($subscription, 'next_billing_date'),
                ],
            ]);
        }

        return $payload;
    }

    public function store(Request $request): JsonResponse
    {
        if ($err = $this->denyUnlessPlatform($request)) {
            return $err;
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'domain' => ['nullable', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,inactive'],
            'plan' => ['nullable', 'string', 'max:100'],
            'seed_default_accounts' => ['nullable', 'boolean'],
            'initial_users' => ['nullable', 'array'],
            'initial_users.admin' => ['nullable', 'array'],
            'initial_users.admin.name' => ['nullable', 'string', 'max:255'],
            'initial_users.admin.email' => ['nullable', 'email', 'max:255'],
            'initial_users.admin.password' => ['nullable', 'string', 'min:6', 'max:255'],
            'initial_users.teachers' => ['nullable', 'array'],
            'initial_users.teachers.*.name' => ['required', 'string', 'max:255'],
            'initial_users.teachers.*.email' => ['required', 'email', 'max:255'],
            'initial_users.teachers.*.password' => ['nullable', 'string', 'min:6', 'max:255'],
            'initial_users.teachers.*.subject' => ['nullable', 'string', 'max:255'],
            'initial_users.teachers.*.phone' => ['nullable', 'string', 'max:50'],
            'initial_users.parents' => ['nullable', 'array'],
            'initial_users.parents.*.name' => ['required', 'string', 'max:255'],
            'initial_users.parents.*.email' => ['required', 'email', 'max:255'],
            'initial_users.parents.*.password' => ['nullable', 'string', 'min:6', 'max:255'],
            'initial_users.parents.*.phone' => ['nullable', 'string', 'max:50'],
            'initial_users.students' => ['nullable', 'array'],
            'initial_users.students.*.name' => ['required', 'string', 'max:255'],
            'initial_users.students.*.email' => ['required', 'email', 'max:255'],
            'initial_users.students.*.password' => ['nullable', 'string', 'min:6', 'max:255'],
        ]);

        $slug = ! empty($payload['slug']) ? Str::slug($payload['slug']) : Str::slug($payload['name']);
        if (! $slug) {
            $slug = 'center-'.Str::lower(Str::random(6));
        }
        if (Center::query()->where('slug', $slug)->exists()) {
            $slug = $slug.'-'.Str::lower(Str::random(4));
        }

        $plan = $payload['plan'] ?? 'Starter';
        $subscriptionStatus = (($payload['status'] ?? 'active') === 'active') ? 'trial' : 'cancelled';

        $center = Center::query()->create([
            'name' => $payload['name'],
            'slug' => $slug,
            'domain' => $payload['domain'] ?? ($slug.'.localhost'),
            'status' => (($payload['status'] ?? 'active') === 'active') ? 1 : 0,
            'data' => [
                'plan' => $plan,
                'subscription' => [
                    'plan' => $plan,
                    'amount' => 0,
                    'billing_cycle' => 'monthly',
                    'status' => $subscriptionStatus,
                    'next_billing_date' => now()->addMonth()->toDateString(),
                ],
            ],
        ]);

        $seedDefaults = array_key_exists('seed_default_accounts', $payload)
            ? (bool) $payload['seed_default_accounts']
            : true;

        $provisionResult = SetupCenter::dispatchSync(
            $center,
            false,
            $payload['initial_users'] ?? null,
            $seedDefaults,
        );

        $accounts = is_array($provisionResult) ? ($provisionResult['accounts'] ?? []) : [];

        return response()->json([
            'id' => $center->id,
            'name' => $center->name,
            'domain' => $center->domain,
            'slug' => $center->slug,
            'plan' => $plan,
            'status' => ($payload['status'] ?? 'active'),
            'created_at' => now()->toDateString(),
            'default_accounts' => array_map(
                fn (array $row) => [
                    'role' => $row['role'],
                    'name' => $row['name'],
                    'email' => $row['email'],
                    'password' => $row['password'],
                ],
                $accounts,
            ),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        if ($err = $this->denyUnlessPlatform($request)) {
            return $err;
        }

        $center = Center::query()->where('id', $id)->orWhere('slug', $id)->first();
        if (! $center) {
            return response()->json(['message' => 'Center not found'], 404);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'domain' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:active,inactive'],
            'plan' => ['nullable', 'string', 'max:100'],
        ]);

        $data = is_array($center->data) ? $center->data : [];
        data_set($data, 'plan', $payload['plan'] ?? data_get($data, 'plan', 'Starter'));
        data_set($data, 'subscription.plan', $payload['plan'] ?? data_get($data, 'subscription.plan', 'Starter'));

        $center->update([
            'name' => $payload['name'],
            'domain' => $payload['domain'] ?? $center->domain,
            'status' => (($payload['status'] ?? 'active') === 'active') ? 1 : 0,
            'data' => $data,
        ]);

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        if ($err = $this->denyUnlessPlatform($request)) {
            return $err;
        }

        $center = Center::query()->where('id', $id)->orWhere('slug', $id)->first();
        if (! $center) {
            return response()->json(['message' => 'Center not found'], 404);
        }

        DeleteCenterData::dispatchSync($center);
        $center->delete();

        return response()->json(['ok' => true]);
    }
}
