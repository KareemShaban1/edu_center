<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Parent;

use App\Http\Controllers\Controller;
use App\Http\Support\ApiBearerAuth;
use App\Http\Support\MultiCenterPortalService;
use App\Http\Support\ResolvesParentApiContext;
use App\Models\Parents;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParentBootstrapApiController extends Controller
{
    use ResolvesParentApiContext;

    public function show(Request $request): JsonResponse
    {
        $bearer = ApiBearerAuth::resolve($request);
        $portalMode = $request->session()->get('api_portal_mode') || ($bearer['portal'] ?? false);
        if ($portalMode) {
            $email = $request->session()->get('api_profile_email') ?: ($bearer['profile_email'] ?? null);
            $userType = $request->session()->get('api_profile_user_type', Parents::class) ?: ($bearer['user_type'] ?? Parents::class);
            if ($email) {
                return response()->json(app(MultiCenterPortalService::class)->parentPortal($email, $userType));
            }
        }

        ['error' => $error, 'parentId' => $parentId] = $this->resolveParentContext($request);
        if ($error) {
            return $error;
        }

        return response()->json(app(MultiCenterPortalService::class)->parentBootstrap($parentId));
    }
}
