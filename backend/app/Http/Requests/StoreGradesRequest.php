<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGradesRequest extends FormRequest
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
     * @return array
     */
    public function rules()
    {
        return [
            'grade_name' => 'required|unique:grades,grade_name,'.$this->id,
            'notes' => 'nullable|string',
        ];
    }

    public function messages()
    {
        return [
            'grade_name.required' => 'برجاء أدخال أسم المرحلة الدراسية بالعربى',
            'grade_name.unique' => 'يجب أن يكون أسم المرحلة الدراسية بالعربى غير مكرر',
            'notes.string' => 'يجب أن يكون الملاحظات عبارة عن نص',
        ];
    }
}
