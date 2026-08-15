<?php

declare(strict_types=1);

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;

final class UpdatePlatformSubscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'plan' => ['required', 'string', 'max:100'],
            'amount' => ['nullable', 'numeric'],
            'billing_cycle' => ['nullable', 'in:monthly,yearly'],
            'status' => ['nullable', 'in:active,trial,past_due,cancelled'],
            'next_billing_date' => ['nullable', 'date'],
        ];
    }
}
