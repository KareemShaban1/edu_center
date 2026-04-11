<?php

namespace App\Http\Controllers\Dashboards\TeacherDashboard;

use App\Http\Controllers\Controller;
use App\Models\Classes;
use App\Models\Grade;
use App\Models\MeetingSeries;
use App\Models\Section;
use App\Services\MeetingSeriesGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MeetingSeriesController extends Controller
{
    public function index()
    {
        $teacherEmail = auth()->user()->email;

        // Ensure upcoming occurrences exist (auto-generation window).
        MeetingSeriesGenerator::generateForTeacherSeries(
            $teacherEmail,
            now()->subDay(),
            now()->addDays(30)
        );

        $series = MeetingSeries::query()
            ->where('created_by', $teacherEmail)
            ->orderByDesc('start_date')
            ->get();

        return view('dashboards.teacher.meeting_series.index', compact('series'));
    }

    public function showGroups()
    {
        $grades = Grade::with(['sections' => function ($query) {
            $teacherSectionsIds = DB::table('teacher_section')
                ->where('teacher_id', auth()->user()->id)
                ->pluck('section_id');

            $query->whereIn('id', $teacherSectionsIds)
                ->with(['students' => function ($q) {
                    $q->count();
                }]);
        }])->get();

        return view('dashboards.teacher.meeting_series.show_groups', compact('grades'));
    }

    public function create($group_id)
    {
        $teacherSectionsIds = DB::table('teacher_section')
            ->where('teacher_id', auth()->user()->id)
            ->pluck('section_id');

        $section = Section::where('id', $group_id)->whereIn('id', $teacherSectionsIds)->firstOrFail();
        $class = Classes::where('id', $section->class_id)->where('grade_id', $section->grade_id)->firstOrFail();
        $grade = Grade::where('id', $section->grade_id)->firstOrFail();

        return view('dashboards.teacher.meeting_series.create', compact('grade', 'section', 'class'));
    }

    public function store(Request $request)
    {
        try {
            $teacherEmail = auth()->user()->email;

            $provider = $request->input('provider');
            $weekDays = $request->input('week_days', []);

            $request->validate([
                'grade_id' => 'required|integer',
                'class_id' => 'required|integer',
                'section_id' => 'required|integer',
                'topic' => 'required|string|max:255',

                'provider' => 'required|in:jitsi,livekit,external,offline',
                'duration' => 'required|integer|min:15|max:480',

                'start_date' => 'required|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'start_time' => 'required|date_format:H:i',
                'week_days' => 'required|array|min:1|max:7',

                'record_enabled' => 'nullable|boolean',

                'join_url' => 'required_if:provider,external|string|max:2000',
                'moderator_url' => 'nullable|string|max:2000',
                'password' => 'nullable|string|max:255',
                'external_ref' => 'nullable|string|max:255',

                'location' => 'required_if:provider,offline|string|max:2000',
                'notes' => 'nullable|string|max:5000',
            ]);

            $series = MeetingSeries::create([
                'created_by' => $teacherEmail,
                'grade_id' => (int) $request->grade_id,
                'class_id' => (int) $request->class_id,
                'section_id' => (int) $request->section_id,
                'topic' => $request->topic,

                'provider' => $provider,
                'week_days' => array_map(fn ($d) => (int) $d, (array) $weekDays),
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'start_time' => $request->start_time,

                'duration' => (int) $request->duration,
                'record_enabled' => (bool) ($request->boolean('record_enabled') ?? false),

                'join_url' => $request->join_url,
                'moderator_url' => $request->moderator_url,
                'password' => $request->password,
                'external_ref' => $request->external_ref,

                'location' => $request->location,
                'notes' => $request->notes,
            ]);

            // Generate next 8 weeks immediately for better UX.
            MeetingSeriesGenerator::generateForSeries(
                $series,
                now()->subDay(),
                now()->addDays(56)
            );

            return redirect()->route('teacher_meeting_series.index');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        try {
            MeetingSeries::where('id', $id)->where('created_by', auth()->user()->email)->delete();
            return redirect()->route('teacher_meeting_series.index');
        } catch (\Exception $e) {
            return redirect()->back()->with(['error' => $e->getMessage()]);
        }
    }
}

