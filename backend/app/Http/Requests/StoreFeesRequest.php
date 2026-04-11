<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFeesRequest extends FormRequest
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
            'title' => 'required',
            // 'title_en' => 'required',
            'amount' => 'required|numeric',
            'grade_id' => 'required|integer',
            'class_id' => 'required|integer',
            'section_id' => 'required|integer',
            'month'=>'required',
            'year' => 'required',
        ];
    }

    public function messages()
    {
        return [
            'title_ar.required' => trans('validation.required'),
            'title_en.required' => trans('validation.unique'),
            'Password.required' => trans('validation.required'),
            'amount.required' => trans('validation.required'),
            'amount.numeric' => trans('validation.numeric'),
            'grade_id.required' => trans('validation.required'),
            'class_id.required' => trans('validation.required'),
            'year.required' => trans('validation.required'),
        ];
    }
}
