<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreStudentsRequest extends FormRequest
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
            'name' => 'required',
            'email' => 'required|email|unique:students,email,' . $this->id,
            'password' => 'required|string|min:6|max:10',
            'gender' => 'required',
            'grade_id' => 'required',
            'class_id' => 'required',
            'section_id' => 'required',
            'parent_id' => 'required',
            'academic_year' => 'required',
            'is_active' => 'required',
        ];
    }


    public function messages()
    {
        return [
            'name_ar.required' => trans('admin/students_trans.required_ar'),
            'name_en.required' => trans('admin/students_trans.required_en'),
            'email.required' => trans('admin/students_trans.email_required'),
            'gender_id.required' => trans('admin/students_trans.gender_id.required'),
            'grade_id.required' =>   trans('admin/students_trans.grade_id.required'),
            'class_id.required' => trans('admin/students_trans.class_id.required'),
            'section_id.required' => trans('admin/students_trans.section_id.required'),
            'parent_id.required' => trans('admin/students_trans.parent_id.required'),
            'academic_year.required' => trans('admin/students_trans.academic_year.required'),

        ];
    }
}


