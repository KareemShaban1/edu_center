<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateFeeRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'classroom_id' => ['required', 'integer', 'exists:center.classes,id'],
            'section_id' => ['required', 'integer', 'exists:center.sections,id'],
            'description' => ['nullable', 'string', 'max:255'],
            'year' => ['nullable', 'string', 'max:20'],
            'month' => ['required', 'string', 'max:20'],
            'type' => ['required', 'in:monthly,half-monthly,book,other'],
        ];
    }
}
