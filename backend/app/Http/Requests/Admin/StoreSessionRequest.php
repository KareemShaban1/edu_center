<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class StoreSessionRequest extends FormRequest
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
            'section_id' => ['required', 'integer'],
            'topic' => ['required', 'string', 'max:255'],
            'start_at' => ['required', 'date'],
            'duration' => ['required', 'integer', 'min:15', 'max:480'],
            'session_type' => ['nullable', 'in:offline,online,exam,others'],
            'provider' => ['nullable', 'in:jitsi,livekit,external,offline,zoom,microsoft_teams,google_meet'],
            'join_url' => ['nullable', 'string', 'max:2000'],
            'moderator_url' => ['nullable', 'string', 'max:2000'],
            'password' => ['nullable', 'string', 'max:255'],
            'external_ref' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:2000'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'geofence_radius_m' => ['nullable', 'integer', 'min:30', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'record_enabled' => ['nullable', 'boolean'],
        ];
    }
}
