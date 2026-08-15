<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Support\ApiBearerAuth;
use App\Http\Support\MultiCenterPortalService;
use App\Http\Support\ResolvesStudentApiContext;
use App\Models\Student;
use App\Services\StudentBootstrapService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class StudentBootstrapApiController extends Controller
{
    use ResolvesStudentApiContext;

    public function __construct(
        private readonly StudentBootstrapService $bootstrapService,
        private readonly MultiCenterPortalService $portalService,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $bearer = ApiBearerAuth::resolve($request);
        $portalMode = $request->session()->get('api_portal_mode') || ($bearer['portal'] ?? false);
        if ($portalMode) {
            $email = $request->session()->get('api_profile_email') ?: ($bearer['profile_email'] ?? null);
            $userType = $request->session()->get('api_profile_user_type', Student::class) ?: ($bearer['user_type'] ?? Student::class);
            if ($email) {
                return response()->json($this->portalService->studentPortal($email, $userType));
            }
        }

        ['error' => $error, 'tenantDb' => $tenantDb, 'studentId' => $studentId, 'student' => $student] = $this->resolveStudentContext($request);
        if ($error) {
            return $error;
        }

        return response()->json($this->bootstrapService->build($tenantDb, $studentId, $student));
    }
}
