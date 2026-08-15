<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Support\MultiCenterPortalService;
use App\Http\Support\ResolvesStudentApiContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class StudentPortalApiController extends Controller
{
    use ResolvesStudentApiContext;

    public function __construct(
        private readonly MultiCenterPortalService $portalService,
    ) {}

    public function portal(Request $request): JsonResponse
    {
        ['error' => $error, 'email' => $email, 'userType' => $userType] = $this->resolveStudentPortalContext($request);
        if ($error) {
            return $error;
        }

        return response()->json($this->portalService->studentPortal($email, $userType));
    }
}
