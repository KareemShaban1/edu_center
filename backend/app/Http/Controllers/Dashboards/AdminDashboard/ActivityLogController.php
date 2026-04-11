<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Http\Requests\StoreActivityLogRequest;
use App\Http\Requests\UpdateActivityLogRequest;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;

class ActivityLogController extends Controller
{
    public function index()
    {
        return view('dashboards.admin.activityLog.index');
    }

    public function data(Request $request)
    {
        $query = ActivityLog::class::with('user');

        // Filter by Action
        if ($request->has('action') && !empty($request->action)) {
            $query->where('action', $request->action);
        }

        // Filter by Model
        if ($request->has('model') && !empty($request->model)) {
            $query->where('model', $request->model);
        }

        // Filter by User
        if ($request->has('user') && !empty($request->user)) {
            $query->where('user_id', $request->user);
        }

        // Filter by Date Range
        if ($request->has('date_range') && !empty($request->date_range)) {
            [$startDate, $endDate] = explode(' - ', $request->date_range);
            $query->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        }

        return DataTables::of($query)
            ->filterColumn('model_id', function ($query, $value) {
                $query->where('model_id', $value);
            })
            ->editColumn('created_at', function ($item) {
                return $item->created_at->format('Y-m-d H:i:s');
            })
            ->editColumn('action', function ($item) {
                return match ($item->action) {
                    'created' => __('created'),
                    'updated' => __('updated'),
                    'deleted' => __('deleted'),
                    default => __('Unknown'),
                };
            })
            ->editColumn('model', function ($item) {
                return match ($item->model) {
                    'App\Models\User' => __('User'),
                    'App\Models\Announcement' => __('Announcement'),
                    'App\Models\Grade' => __('Grade'),
                    'App\Models\Classes' => __('Classes'),
                    'App\Models\Section' => __('Section'),
                    'App\Models\Student' => __('Student'),
                    'App\Models\Teacher' => __('Teacher'),
                    'App\Models\Parents' => __('Parents'),
                    'App\Models\Fee' => __('Fee'),
                    'App\Models\Payment' => __('Payment'),
                    'App\Models\Book' => __('Book'),
                    'App\Models\Attendance' => __('Attendance'),
                    'App\Models\CertificationTemplate' => __('Certification Template'),
                    'App\Models\WhatsappTemplate' => __('Whatsapp Template'),
                    'App\Models\Homework' => __('Homework'),
                    'App\Models\ExamDegree' => __('Exam Degree'),
                    'App\Models\QuizDegree' => __('Quiz Degree'),
                    'App\Models\Lesson' => __('Lesson'),
                    'App\Models\Unit' => __('Unit'),
                    'App\Models\Question' => __('Question'),
                    'App\Models\Answer' => __('Answer'),
                    'App\Models\Library' => __('Library'),
                    'App\Models\Word' => __('Word'),
                    'App\Models\Note' => __('Note'),
                    'App\Models\Setting' => __('Setting'),
                    default => $item->model, // Fallback for unexpected values
                };
            })
            ->editColumn('changes', function ($item) {
                

                if (!$item->changes) {
                    return __('N/A');
                }

                try {
                    $parsedChanges = json_decode($item->changes, true);
                    if (!is_array($parsedChanges)) {
                        return __('Invalid Data');
                    }

                    $changesList = '<ul>';
                    foreach ($parsedChanges as $key => $value) {
                        if ($key === 'updated_at') {
                            continue; // Skip 'updated_at'
                        }
                     

                        $translatedKey = match ($key) {
                            'name' => __('Name'),
                            'email' => __('Email'),
                            'phone' => __('Phone'),
                            'role' => __('Role'),
                            'status' => __('Status'),
                            'grade' => __('Grade'),
                            'class' => __('Class'),
                            'section' => __('Section'),
                            'student' => __('Student'),
                            'teacher' => __('Teacher'),
                            'parent' => __('Parent'),
                            'fee' => __('Fee'),
                            'payment' => __('Payment'),
                            'book' => __('Book'),
                            'attendance' => __('Attendance'),
                            'certification_template' => __('Certification Template'),
                            'whatsapp_template' => __('Whatsapp Template'),
                            'homework' => __('Homework'),
                            'exam_degree' => __('Exam Degree'),
                            'quiz_degree' => __('Quiz Degree'),
                            'lesson' => __('Lesson'),
                            'unit' => __('Unit'),
                            'question' => __('Question'),
                            'answer' => __('Answer'),
                            'library' => __('Library'),
                            'word' => __('Word'),
                            'note' => __('Note'),
                            'setting' => __('Setting'),
                            default => ucfirst(str_replace('_', ' ', $key)),
                        };

                        if ($key === 'password') {
                            $changesList .= "<li><strong>{$translatedKey}:</strong> '********' </li>";
                        }
                    

                        if ($translatedKey !== '' && $key !== 'password') {
                            $changesList .= "<li><strong>{$translatedKey}:</strong> {$value}</li>";
                        }
                    }
                    $changesList .= '</ul>';

                    return $changesList;
                } catch (\Exception $e) {
                    return __('Invalid JSON');
                }
            })
            ->rawColumns(['changes'])
            ->make(true);
    }
}
