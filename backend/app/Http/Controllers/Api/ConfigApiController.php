<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ConfigApiController extends Controller
{
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
