<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Parent;

use App\Http\Controllers\Controller;
use App\Http\Support\MultiCenterPortalService;
use App\Http\Support\ResolvesParentApiContext;
use App\Models\Parents;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParentPortalApiController extends Controller
{
    use ResolvesParentApiContext;

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
