<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAnnouncementRequest extends FormRequest
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

            'title' => 'required',
            'grade_id' => 'required',
            'class_id' => 'required',
            'section_id' => 'required',
            'announcement_type' => 'required',

        ];
    }

    public function messages()
    {
        return [
            'title.required' => trans(' برجاء أدخال أسم الأعلان'),
            'grade_id.required' => trans('برجاء أدخال المرحلة الدراسية '),
            'class_id.required' => trans('برجاء أدخال  الفصل الدراسى'),
            'section_id.required' => trans('برجاء أدخال المجموعة'),
            'announcement_type.required' => trans('برجاء أدخال نوع الأعلان'),
        ];
    }
}
