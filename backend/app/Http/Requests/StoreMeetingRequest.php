<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMeetingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'grade_id' => 'required|integer',
            'class_id' => 'required|integer',
            'section_id' => 'required|integer',
            'topic' => 'required|string|max:255',
            'start_time' => 'required|date',
            'duration' => 'required|integer|min:15|max:480',
            'provider' => 'required|in:jitsi,livekit,external',
            'join_url' => 'required_if:provider,external|nullable|string|max:2000',
            'moderator_url' => 'nullable|string|max:2000',
            'password' => 'nullable|string|max:255',
            'external_ref' => 'nullable|string|max:255',
            'record_enabled' => 'nullable|boolean',
        ];
    }
}
