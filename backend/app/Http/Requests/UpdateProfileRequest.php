<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
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
            'Name_ar' => 'required',
            'Name_en' => 'required',
            'password' => 'nullable|min:6|confirmed'
        ];
    }

    public function messages()
    {
        return [
            'Name_ar.required' => 'الأسم بالعربى مطلوب',
            'Name_en.required' => 'الأسم بالأنجليزى مطلوب',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
            'password.confirmed' => 'كلمة المرور وتأكيد كلمة المرور غير متطابقين',
        ];
    }
}
