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

class PlatformRolesApiController extends Controller
{
    use ResolvesPlatformApiContext;
    public function index(Request $request): JsonResponse
    {
$ctx = $this->resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        $platformAdmins = Schema::connection($conn)->hasTable('admins')
            ? (int) DB::connection($conn)->table('admins')->count()
            : 0;
        $roles = collect([
            ['id' => 1, 'name' => 'platform_admin', 'guard' => 'platform_admin', 'permissions' => 0, 'users' => $platformAdmins],
            ['id' => 2, 'name' => 'admin', 'guard' => 'web', 'permissions' => 0, 'users' => 0],
            ['id' => 3, 'name' => 'teacher', 'guard' => 'teacher', 'permissions' => 0, 'users' => 0],
            ['id' => 4, 'name' => 'student', 'guard' => 'student', 'permissions' => 0, 'users' => 0],
            ['id' => 5, 'name' => 'parent', 'guard' => 'parent', 'permissions' => 0, 'users' => 0],
        ])->values();
        return response()->json(['roles' => $roles, 'can_manage' => false]);
    }

}
