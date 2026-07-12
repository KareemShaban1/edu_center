<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Support\MultiCenterPortalService;
use App\Http\Support\ResolvesStudentApiContext;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class StudentPortalApiController extends Controller
{
    use ResolvesStudentApiContext;
    public function portal(Request $request): JsonResponse
    {
if ($request->session()->get('api_auth_guard') !== 'student') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $email = $request->session()->get('api_profile_email');
        $userType = $request->session()->get('api_profile_user_type', Student::class);
        if (! $email) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json(app(MultiCenterPortalService::class)->studentPortal($email, $userType));
    }

}
