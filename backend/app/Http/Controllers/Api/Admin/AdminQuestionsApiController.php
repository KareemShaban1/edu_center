<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkStoreQuestionsRequest;
use App\Http\Requests\Admin\StoreQuestionRequest;
use App\Http\Requests\Admin\UpdateQuestionRequest;
use App\Http\Support\ResolvesAdminApiContext;
use App\Services\QuestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminQuestionsApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly QuestionService $questionService,
    ) {}

    public function store(StoreQuestionRequest $request): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $question = $this->questionService->create($request->validated(), $tenant);

        return response()->json([
            'question' => $question,
        ], 201);
    }

    public function bulkStore(BulkStoreQuestionsRequest $request): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $result = $this->questionService->bulkCreate($request->validated(), $tenant);

        return response()->json([
            'questions' => $result['created'],
            'count' => $result['count'],
        ], 201);
    }

    public function update(UpdateQuestionRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $question = $this->questionService->update($id, $request->validated(), $tenant);

        return response()->json([
            'question' => $question,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $this->questionService->delete($id);

        return response()->json([
            'message' => 'Question deleted',
        ]);
    }
}
