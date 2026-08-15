<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSectionRequest;
use App\Http\Requests\Admin\UpdateSectionRequest;
use App\Http\Resources\SectionResource;
use App\Http\Resources\SectionSessionResource;
use App\Http\Resources\SectionWithLabelsResource;
use App\Http\Support\ResolvesAdminApiContext;
use App\Services\SectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminSectionsApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly SectionService $sectionService,
    ) {}

    public function store(StoreSectionRequest $request): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $section = $this->sectionService->create($request->validated());

        return response()->json([
            'section' => SectionResource::make($section),
        ], 201);
    }

    public function update(UpdateSectionRequest $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $section = $this->sectionService->update($id, $request->validated());
        if ($section === null) {
            return response()->json(['message' => 'Section not found'], 404);
        }

        return response()->json([
            'section' => SectionResource::make($section),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $result = $this->sectionService->delete($id);
        if ($result === null) {
            return response()->json(['message' => 'Section not found'], 404);
        }
        if ($result === 'related') {
            return response()->json(['message' => 'Cannot delete a section that has related records'], 409);
        }

        return response()->json(['message' => 'Section deleted']);
    }

    public function sessions(Request $request, int $sectionId): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $payload = $this->sectionService->sessions($sectionId);
        if ($payload === null) {
            return response()->json(['message' => 'Section not found'], 404);
        }

        if ($payload['section'] === null) {
            return response()->json(['section' => null, 'sessions' => []]);
        }

        return response()->json([
            'section' => SectionWithLabelsResource::make($payload['section']),
            'sessions' => SectionSessionResource::collection($payload['sessions']),
        ]);
    }
}
