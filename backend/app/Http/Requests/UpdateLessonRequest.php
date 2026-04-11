<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLessonRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'unit_id' => 'required|exists:units,id',
            'notes' => 'nullable|string',
        ];
    }

    public function messages()
    {
        return [
            'name.required' => 'يجب أن يكون لديك اسم للدرس',
            'unit_id.required' => 'يجب أن يكون لديك وحدة للدرس',
            'unit_id.exists' => 'يجب أن يكون الوحدة موجودة',
            'notes.string' => 'يجب أن تكون الملاحظات عبارة عن نص',
        ];
    }


}
