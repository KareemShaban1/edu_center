<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSectionRequest extends FormRequest
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

            'section_name' => 'required',
            'grade_id' => 'required|exists:grades,id',
            'class_id' => 'required|exists:classes,id',

        ];
    }

    public function messages()
    {
        return [
            'section_name.required' => trans('admin/Sections_trans.required_ar'),
            'grade_id.required' => trans('admin/Sections_trans.Grade_id_required'),
            'class_id.required' => trans('admin/Sections_trans.Class_id_required'),
        ];
    }
}
