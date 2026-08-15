<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Http\Support\SectionWeekDays;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Schema;

final class UpdateSectionRequest extends FormRequest
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
        return array_merge([
            'name' => ['required', 'string', 'max:255'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'class_id' => ['required', 'integer', 'exists:center.classes,id'],
            'teacher_id' => ['nullable', 'integer', 'exists:center.teachers,id'],
        ], Schema::connection('center')->hasColumn('sections', 'week_days') ? SectionWeekDays::validationRules() : []);
    }
}
