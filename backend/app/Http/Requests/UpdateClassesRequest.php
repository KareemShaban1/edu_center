<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClassesRequest extends FormRequest
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
            'class_name' => 'required|string|unique:classes,class_name,' . $this->id,
            'grade_id' => 'required|exists:grades,id',
        ];
    }

    public function messages()
    {
        return [
            'class_name.required' => 'برجاء أدخال أسم الصف الدراسي',
            'grade_id.required' => 'برجاء أدخال المرحلة الدراسية',
            'grade_id.exists' => 'المرحلة الدراسية غير موجودة',
        ];
    }
}
