<?php

declare(strict_types=1);

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;

final class StorePlatformUserRequest extends FormRequest
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
        $conn = (string) config('database.default', 'mysql');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:'.$conn.'.admins,email'],
            'password' => ['nullable', 'string', 'min:6', 'max:100'],
            'role' => ['nullable', 'string'],
        ];
    }
}
