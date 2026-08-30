<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateExamLayoutRequest extends FormRequest
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
            'header' => ['nullable', 'array'],
            'header.enabled' => ['nullable', 'boolean'],
            'header.html' => ['nullable', 'string', 'max:10000'],
            'header.align' => ['nullable', Rule::in(['left', 'center', 'right'])],
            'footer' => ['nullable', 'array'],
            'footer.enabled' => ['nullable', 'boolean'],
            'footer.html' => ['nullable', 'string', 'max:10000'],
            'footer.align' => ['nullable', Rule::in(['left', 'center', 'right'])],
            'body' => ['nullable', 'array'],
            'body.instructions_html' => ['nullable', 'string', 'max:20000'],
            'body.show_answers' => ['nullable', 'boolean'],
            'body.number_questions' => ['nullable', 'boolean'],
            'body.font_family' => ['nullable', 'string', 'max:100'],
            'body.font_size' => ['nullable', 'integer', 'min:8', 'max:24'],
            'body.answer_marker_style' => ['nullable', Rule::in([
                'letter_paren', 'letter_dot', 'letter_only',
                'number_paren', 'number_dot',
                'arabic_paren', 'arabic_dot',
                'bullet', 'dash',
            ])],
            'body.answers_per_row' => ['nullable', 'integer', 'min:1', 'max:4'],
            'body.content_direction' => ['nullable', Rule::in(['rtl', 'ltr'])],
            'body.question_spacing' => ['nullable', 'integer', 'min:4', 'max:48'],
            'body.question_divider' => ['nullable', 'boolean'],
            'body.short_answer_lines' => ['nullable', 'integer', 'min:1', 'max:8'],
            'page' => ['nullable', 'array'],
            'page.margin_mm' => ['nullable', 'integer', 'min:5', 'max:40'],
            'page.orientation' => ['nullable', Rule::in(['P', 'L'])],
        ];
    }
}
