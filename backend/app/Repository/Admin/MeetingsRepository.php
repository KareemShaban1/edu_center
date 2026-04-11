<?php

namespace App\Repository\Admin;

use App\Models\Grade;
use App\Models\Meeting;
use Illuminate\Http\Request;

class MeetingsRepository implements MeetingsRepositoryInterface
{
    public function index()
    {
        $meetings = Meeting::where('created_by', auth()->user()->email)->get();

        return view('dashboards.admin.meetings.index', compact('meetings'));
    }

    public function create()
    {
        $grades = Grade::all();

        return view('dashboards.admin.meetings.add', compact('grades'));
    }

    public function indirectCreate()
    {
        $grades = Grade::all();

        return view('dashboards.admin.meetings.indirect', compact('grades'));
    }

    public function store($request)
    {
        try {
            $this->createMeetingFromRequest($request, auth()->user()->email);

            return redirect()->route('meetings.index');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function storeIndirect($request)
    {
        try {
            $this->createMeetingFromRequest($request, auth()->user()->email);

            return redirect()->route('meetings.index');
        } catch (\Exception $e) {
            return redirect()->back()->with(['error' => $e->getMessage()]);
        }
    }

    public function show($id) {}

    public function edit($id) {}

    public function update($request, $id) {}

    public function destroy(int $id)
    {
        try {
            Meeting::destroy($id);

            return redirect()->route('meetings.index');
        } catch (\Exception $e) {
            return redirect()->back()->with(['error' => $e->getMessage()]);
        }
    }

    private function createMeetingFromRequest(Request $request, string $createdBy): void
    {
        $request->validate([
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
        ]);

        $provider = $request->input('provider');
        $base = [
            'grade_id' => (int) $request->grade_id,
            'class_id' => (int) $request->class_id,
            'section_id' => (int) $request->section_id,
            'created_by' => $createdBy,
            'topic' => $request->topic,
            'start_at' => $request->start_time,
            'duration' => (int) $request->duration,
            'password' => $request->password,
            'record_enabled' => $request->boolean('record_enabled'),
            'provider' => $provider,
        ];

        if ($provider === 'jitsi') {
            $links = \App\Services\MeetingLinkService::forJitsi();
            Meeting::create(array_merge($base, [
                'room_slug' => $links['room_slug'],
                'join_url' => $links['join_url'],
                'moderator_url' => $links['moderator_url'],
                'external_ref' => null,
            ]));

            return;
        }

        if ($provider === 'livekit') {
            if (! \App\Services\LiveKitAccessTokenService::isConfigured()) {
                throw new \RuntimeException('LiveKit is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in .env.');
            }
            $slug = \App\Services\MeetingLinkService::generateRoomSlug();
            $links = \App\Services\MeetingLinkService::forLiveKit($slug);
            Meeting::create(array_merge($base, [
                'room_slug' => $slug,
                'join_url' => $links['join_url'],
                'moderator_url' => $links['moderator_url'],
                'external_ref' => null,
            ]));

            return;
        }

        Meeting::create(array_merge($base, [
            'room_slug' => null,
            'join_url' => (string) $request->join_url,
            'moderator_url' => $request->moderator_url,
            'external_ref' => $request->external_ref,
        ]));
    }
}
