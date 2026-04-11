<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreExamDegreeRequest extends FormRequest
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
            'final_degree' => 'required|numeric|min:0',
        ];
    }
    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages()
    {
        return [
            'final_degree.required' => 'حقل الدرجة النهائية مطلوب.',
            'final_degree.required' => 'يجب إدخال الدرجة النهائية',
            'final_degree.numeric' => 'الدرجة النهائية يجب أن تكون رقماً',
            'final_degree.min' => 'الدرجة النهائية يجب أن تكون 0 أو أكبر'
        ];
    }
}
