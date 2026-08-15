<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class PostPaymentSectionDateRequest extends FormRequest
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
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.id' => ['nullable', 'integer'],
            'rows.*.student_id' => ['required', 'integer', 'exists:center.students,id'],
            'rows.*.payment_date' => ['nullable', 'date_format:Y-m-d'],
            'rows.*.fee_id' => ['required', 'integer', 'exists:center.fees,id'],
            'rows.*.payment_status' => ['required', 'in:paid,unpaid'],
            'rows.*.month' => ['required', 'string', 'max:20'],
            'rows.*.amount' => ['nullable', 'numeric', 'min:0'],
            'rows.*.notes' => ['nullable', 'string'],
        ];
    }
}
