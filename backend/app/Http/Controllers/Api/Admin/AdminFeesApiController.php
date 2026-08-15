<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreFeeRequest;
use App\Http\Requests\Admin\UpdateFeeRequest;
use App\Http\Resources\FeeResource;
use App\Http\Support\ResolvesAdminApiContext;
use App\Models\Fee;
use App\Services\FeeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminFeesApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly FeeService $feeService,
    ) {}

    public function store(StoreFeeRequest $request): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $fee = $this->feeService->create($request->validated(), $tenant);

        return response()->json([
            'fee' => FeeResource::make($fee),
        ], 201);
    }

    public function update(UpdateFeeRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $fee = Fee::on('center')->find($id);
        if ($fee === null) {
            return response()->json(['message' => 'Fee not found'], 404);
        }

        $fee = $this->feeService->update($fee, $request->validated(), $tenant);

        return response()->json([
            'fee' => FeeResource::make($fee),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $result = $this->feeService->delete($id);
        if ($result === null) {
            return response()->json(['message' => 'Fee not found'], 404);
        }
        if ($result === 'related') {
            return response()->json(['message' => 'Fee has related payments'], 409);
        }

        return response()->json(['message' => 'Fee deleted']);
    }
}
