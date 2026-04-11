<?php

namespace App\Http\Controllers\Dashboards\TeacherDashboard;

use App\Http\Controllers\Controller;
use App\Models\Classes;
use App\Models\Grade;
use App\Models\Meeting;
use App\Models\Section;
use App\Services\MeetingSeriesGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MeetingsController extends Controller
{
    public function index()
    {
        MeetingSeriesGenerator::generateForTeacherSeries(
            auth()->user()->email,
            now()->subDay(),
            now()->addDays(30)
        );

        $meetings = Meeting::where('created_by', auth()->user()->email)->get();

        return view('dashboards.teacher.meetings.index', compact('meetings'));
    }

    public function showGroups()
    {
        $grades = Grade::with(['sections' => function ($query) {
            $teacherSectionsIds = DB::table('teacher_section')
                ->where('teacher_id', auth()->user()->id)->pluck('section_id');
            $query->whereIn('id', $teacherSectionsIds)
                ->with(['students' => function ($query) {
                    $query->count();
                }]);
        }])->get();

        return view('dashboards.teacher.meetings.show_groups', compact('grades'));
    }

    public function create($id)
    {
        $grades = Grade::all();
        $teacherSectionsIds = DB::table('teacher_section')->where('teacher_id', auth()->user()->id)->pluck('section_id');
        $section = Section::where('id', $id)->whereIn('id', $teacherSectionsIds)->firstOrFail();
        $class = Classes::where('id', $section->class_id)->where('grade_id', $section->grade_id)->firstOrFail();
        $grade = Grade::where('id', $section->grade_id)->firstOrFail();

        return view('dashboards.teacher.meetings.add', compact('grade', 'section', 'class'));
    }

    public function indirectCreate()
    {
        $grades = Grade::all();

        return view('dashboards.teacher.meetings.indirect', compact('grades'));
    }

    public function store(Request $request)
    {
        try {
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

            $this->persistMeeting($request, auth()->user()->email);

            return redirect()->route('teacher_meetings.index');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function storeIndirect(Request $request)
    {
        return $this->store($request);
    }

    public function destroy($id)
    {
        try {
            Meeting::where('id', $id)->where('created_by', auth()->user()->email)->delete();

            return redirect()->route('teacher_meetings.index');
        } catch (\Exception $e) {
            return redirect()->back()->with(['error' => $e->getMessage()]);
        }
    }

    public function livekitToken($id)
    {
        $meeting = Meeting::findOrFail($id);
        $hasSection = DB::table('teacher_section')
            ->where('teacher_id', auth()->id())
            ->where('section_id', $meeting->section_id)
            ->exists();
        if (! $hasSection || $meeting->created_by !== auth()->user()->email) {
            abort(403);
        }
        if ($meeting->provider !== 'livekit' || ! \App\Services\LiveKitAccessTokenService::isConfigured()) {
            abort(404);
        }
        $token = \App\Services\LiveKitAccessTokenService::createToken(
            (string) $meeting->room_slug,
            'teacher-'.auth()->id(),
            true,
            (bool) $meeting->record_enabled
        );

        return response()->json([
            'token' => $token,
            'url' => config('meetings.livekit.url'),
            'room' => $meeting->room_slug,
        ]);
    }

    private function persistMeeting(Request $request, string $createdBy): void
    {
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
