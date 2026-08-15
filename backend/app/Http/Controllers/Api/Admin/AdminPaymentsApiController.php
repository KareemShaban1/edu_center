<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PostPaymentSectionDateRequest;
use App\Http\Support\ResolvesAdminApiContext;
use App\Http\Support\SectionDateHelper;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminPaymentsApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly PaymentService $paymentService,
    ) {}

    public function sectionDate(Request $request, int $sectionId, string $date): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        if ($invalid = SectionDateHelper::invalidDateResponse($date)) {
            return $invalid;
        }

        $section = SectionDateHelper::findSection($sectionId);
        if (! $section) {
            return SectionDateHelper::sectionNotFoundResponse();
        }

        $requestedFeeId = $request->query('fee_id');
        $requestedFeeId = is_numeric($requestedFeeId) ? (int) $requestedFeeId : null;
        $payload = $this->paymentService->getSectionDate($sectionId, $date, $requestedFeeId);

        return response()->json([
            'date' => $payload['date'],
            'section' => SectionDateHelper::sectionPayload($section),
            'fees' => $payload['fees'],
            'selected_fee_id' => $payload['selected_fee_id'],
            'rows' => $payload['rows'],
        ]);
    }

    public function postSectionDate(PostPaymentSectionDateRequest $request, int $sectionId, string $date): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        if ($invalid = SectionDateHelper::invalidDateResponse($date)) {
            return $invalid;
        }

        $this->paymentService->saveSectionDate($sectionId, $date, $request->validated());

        return response()->json(['message' => 'Payments saved']);
    }

    public function sectionHistory(Request $request, int $sectionId): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $requestedFeeId = $request->query('fee_id');
        $requestedFeeId = is_numeric($requestedFeeId) ? (int) $requestedFeeId : null;
        $payload = $this->paymentService->getSectionHistory($sectionId, $requestedFeeId);

        return response()->json($payload);
    }
}