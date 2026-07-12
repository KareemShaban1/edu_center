<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Parent;

use App\Http\Controllers\Controller;
use App\Http\Support\MultiCenterPortalService;
use App\Http\Support\ResolvesCenterApiContext;
use App\Models\Parents;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ParentPortalApiController extends Controller
{
    use ResolvesCenterApiContext;
    public function portal(Request $request): JsonResponse
    {
if ($request->session()->get('api_auth_guard') !== 'parent') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $email = $request->session()->get('api_profile_email');
        $userType = $request->session()->get('api_profile_user_type', Parents::class);
        if (! $email) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json(app(MultiCenterPortalService::class)->parentPortal($email, $userType));
    }

}
