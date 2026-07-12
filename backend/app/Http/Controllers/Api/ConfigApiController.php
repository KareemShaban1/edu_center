<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesCenterApiContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ConfigApiController extends Controller
{
    use ResolvesCenterApiContext;
    public function show(Request $request): JsonResponse
    {
return response()->json([
            'storage_mode' => 'central_database',
            'center_table' => 'centers',
            // Backward-compatible aliases
            'tenancy_mode' => 'central_shared',
        ]);
    }

}
