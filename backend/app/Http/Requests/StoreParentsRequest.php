<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreParentsRequest extends FormRequest
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
            'parent_name' => 'required',
            'parent_job' => 'required',
            'parent_phone' => 'nullable',
            'parent_address' => 'nullable',
            'email' => 'required|email|unique:parents,email,' . $this->id,
            'password' => 'required|string|min:6|max:10',
        ];
    }


    public function messages()
    {
        return [
            

        ];
    }
}


