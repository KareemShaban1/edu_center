<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateParentsRequest extends FormRequest
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
            'parent_name' => 'required',
            'parent_job' => 'required',
            'parent_phone' => 'nullable',
            'parent_address' => 'nullable',
            'email'=>['required', 'email', 'max:255', Rule::unique('parents')->ignore($this->parent)],
            'password' => 'nullable|string|min:6|max:10',
          
        ];
    }
}
