<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateParentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:mysql.parents,email,'.$id],
            'password' => ['nullable', 'string', 'min:6', 'max:100'],
            'phone' => ['required', 'string', 'max:20', 'unique:mysql.parents,parent_phone,'.$id],
            'job_title' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,inactive'],
            'address' => ['nullable', 'string', 'max:300'],
        ];
    }
}
