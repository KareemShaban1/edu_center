<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWordRequest extends FormRequest
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
            //
            'word' => 'required|string|max:255',
            'translation' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'lesson_id' => 'required|exists:lessons,id',
        ];
    }
}
