<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreGradeRequest;
use App\Http\Requests\Admin\UpdateGradeRequest;
use App\Http\Resources\GradeResource;
use App\Http\Support\ResolvesAdminApiContext;
use App\Models\Classes;
use App\Models\Grade;
use App\Services\GradeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminGradesApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly GradeService $gradeService,
    ) {}

    public function store(StoreGradeRequest $request): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $grade = $this->gradeService->create($request->validated(), $tenant);

        return response()->json([
            'grade' => GradeResource::make($grade),
        ], 201);
    }

    public function update(UpdateGradeRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $grade = Grade::query()->find($id);
        if ($grade === null) {
            return response()->json(['message' => 'Grade not found'], 404);
        }

        $grade = $this->gradeService->update($grade, $request->validated(), $tenant);

        return response()->json([
            'grade' => GradeResource::make($grade),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $grade = Grade::query()->find($id);
        if ($grade === null) {
            return response()->json(['message' => 'Grade not found'], 404);
        }

        if (Classes::query()->where('grade_id', $id)->exists()) {
            return response()->json(['message' => 'Cannot delete a grade that has classes'], 409);
        }

        $this->gradeService->delete($grade);

        return response()->json(['message' => 'Grade deleted']);
    }
}
