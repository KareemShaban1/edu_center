<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClassesRequest extends FormRequest
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
            'Classes_List' => 'required|array|min:1',
            'Classes_List.*.class_name' => 'required|string|unique:classes,class_name',
            'Classes_List.*.grade_id' => 'required|exists:grades,id',
        ];
    }


    public function messages()
    {
        return [
            'Classes_List.*.class_name.required' => 'برجاء أدخال أسم الصف الدراسي',
            'Classes_List.*.grade_id.required' => 'برجاء أدخال المرحلة الدراسية',
            'Classes_List.*.grade_id.exists' => 'المرحلة الدراسية غير موجودة',
        ];
    }
}
