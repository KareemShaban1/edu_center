<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateAdminSettingsRequest extends FormRequest
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
        return [
            'center_name' => ['nullable', 'string', 'max:255'],
            'center_email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'current_session' => ['nullable', 'string', 'max:50'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'auto_generate_sessions' => ['nullable', 'boolean'],
            'auto_session_days_ahead' => ['nullable', 'integer', 'min:1', 'max:60'],
            'auto_session_duration' => ['nullable', 'integer', 'min:15', 'max:480'],
            'auto_session_type' => ['nullable', 'in:offline,online'],
            'auto_session_provider' => ['nullable', 'in:offline,jitsi,livekit'],
            'auto_session_location' => ['nullable', 'string', 'max:2000'],
            'generate_now' => ['nullable', 'boolean'],
        ];
    }
}
