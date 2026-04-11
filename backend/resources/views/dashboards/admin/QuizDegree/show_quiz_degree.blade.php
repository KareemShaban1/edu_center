@extends('layouts.master')
@section('css')
@section('title')
    {{ trans('admin/quiz_trans.Quiz') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/quiz_trans.Quiz') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->

<x-backend.alert />



<h5 style="font-family: 'Cairo', sans-serif;color: red"> {{ trans('admin/quiz_trans.Quiz_Date') }}:
    {{ $quiz_date }}
</h5>
<div style="margin-bottom: 30px; color:rgb(164, 16, 16); font-weight:bold">
    {{ $section->grade->grade_name }} / {{ $section->class->class_name }} / {{ $section->section_name }}
</div>
<form method="post" action="{{ route('QuizDegree.store_update_quiz_degree') }}">

    <div class="row mb-4">
        <div class="col-md-6">
            <div class="form-group">
                <label for="final_degree" class="font-weight-bold">{{ trans('admin/quiz_trans.Final_Degree') }} <span
                        class="text-danger">*</span></label>
                <input type="number" class="form-control @error('final_degree') is-invalid @enderror" id="final_degree"
                    name="final_degree" min="0" required
                    value="{{ $quizes->first()->final_degree ?? old('final_degree') }}"
                    placeholder="{{ trans('admin/quiz_trans.Enter_Final_Degree') }}">
                @error('final_degree')
                    <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>
        </div>
    </div>>

    @csrf

    <div class="table-responsive">
        <table id="datatable" class="table  table-hover table-sm table-bordered p-0" data-page-length="50"
            style="text-align: center">

            <thead>
                <tr>
                    <th class="alert-success">#</th>
                    <th class="alert-success">{{ trans('admin/quiz_trans.Student_Name') }}</th>
                    <!-- <th class="alert-success">{{ trans('admin/quiz_trans.Email') }}</th>
                    <th class="alert-success">{{ trans('admin/quiz_trans.Gender') }}</th>
                    <th class="alert-success">{{ trans('admin/quiz_trans.Grade') }}</th>
                    <th class="alert-success">{{ trans('admin/quiz_trans.Class') }}</th>
                    <th class="alert-success">{{ trans('admin/quiz_trans.Section') }}</th> -->
                    <th class="alert-success">{{ trans('admin/quiz_trans.Degree') }}</th>
                    <th class="alert-success">{{ trans('admin/quiz_trans.Notes') }}</th>
                    <th class="alert-success">{{ trans('admin/quiz_trans.Notifications') }}</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($students as $student)
                @php
                $student_quiz = $student
                ->quiz()
                ->where('student_id', $student->id)
                ->where('quiz_date', $quiz_date)
                ->first();

                    @endphp
                    <tr>

                        <td>{{ $loop->index + 1 }}</td>
                        <td>{{ $student->name }}</td>
                        <!-- <td>{{ $student->email }}</td>
                    <td>{{ $student->gender }}</td>
                    <td>{{ $student->grade->grade_name }}</td>
                    <td>{{ $student->class->class_name }}</td>
                    <td>{{ $student->section->section_name }}</td> -->
                        <td>
                            <input type="text" name="degree[]"
                                value="{{ old('degree[]', $student->quiz()->where('student_id', $student->id)->where('quiz_date', $quiz_date)->value('degree')) }}"
                                class="form-control">
                        </td>
                        <td>
                            <input type="text" name="notes[]"
                                value="{{ old('notes[]', $student->quiz()->where('student_id', $student->id)->where('quiz_date', $quiz_date)->value('notes')) }}"
                                class="form-control">
                        </td>



                        <td>
                            @if ($student_quiz)
                                <!-- <a href="{{ route('QuizDegree.sendNotification', ['student_id' => $student->id]) }}"

                            class="btn btn-warning btn-sm "
                            role="button"
                            aria-pressed="true">{{ trans('admin/quiz_trans.Send_Notification') }}
                        </a> -->

                        @if ($student->parents->father_phone)
                        <button type="button"
                            class="btn btn-success btn-sm mt-1 select-template-btn"
                            data-toggle="modal" data-target="#whatsappTemplateModal"
                            data-student-id="{{ $student->id }}"
                            data-student-name="{{ $student->name }}"
                            data-quiz-notes="{{ $student_quiz->notes ?? '' }}">
                            📲 {{ trans('admin/exams_trans.Send_WhatsApp') }}
                        </button>

                        @endif
                        @endif
                    </td>
                    <input type="hidden" name="quiz_date[]" value="{{ $quiz_date }}">
                    <input type="hidden" name="student_id[]" value="{{ $student->id }}">
                    <input type="hidden" name="grade_id[]" value="{{ $student->grade_id }}">
                    <input type="hidden" name="class_id[]" value="{{ $student->class_id }}">
                    <input type="hidden" name="section_id[]" value="{{ $student->section_id }}">
                </tr>
                @empty
                    <div style="text-align: center; font-size:30px"> {{ trans('admin/quiz_trans.There_Is_No_Quiz') }}
                    </div>
                    <div style="display: flex; justify-content: center;" class="col-md-12 col-12">
                        <img src="{{ asset('images/icons/not_found.webp') }}" height="300" width="300"
                            alt="">
                    </div>
                @endforelse

            </tbody>
        </table>

        <button class="btn btn-success" type="submit">{{ trans('admin/quiz_trans.Submit') }}</button>

    </div>


</form><br>

<!-- WhatsApp Template Modal -->
<div class="modal fade" id="whatsappTemplateModal" tabindex="-1" role="dialog" aria-labelledby="templateModalLabel"
    aria-hidden="true">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="templateModalLabel">{{ trans('admin/attendance_trans.Select_Template') }}
                </h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <div class="template-options mb-4">
                    <h6>{{ trans('admin/attendance_trans.Quick_Templates') }}:</h6>
                    <div class="btn-group-vertical w-100">
                        <button type="button" class="btn btn-outline-primary mb-2 template-option"
                            data-template="default">
                            {{ trans('admin/attendance_trans.Default_Template') }}
                        </button>
                        <button type="button" class="btn btn-outline-primary mb-2 template-option"
                            data-template="with-notes">
                            {{ trans('admin/attendance_trans.With_Notes_Template') }}
                        </button>
                        <button type="button" class="btn btn-outline-primary mb-2 template-option"
                            data-template="custom">
                            {{ trans('admin/attendance_trans.Custom_Template') }}
                        </button>
                    </div>
                </div>

                <div class="form-group">
                    <label for="messagePreview">{{ trans('admin/attendance_trans.Message_Preview') }}:</label>
                    <textarea class="form-control" id="messagePreview" rows="5" dir="rtl"></textarea>
                </div>

                <input type="hidden" id="selectedStudentId">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">
                    {{ trans('admin/attendance_trans.Close') }}
                </button>
                <button type="button" class="btn btn-success" id="sendWhatsappBtn">
                    {{ trans('admin/attendance_trans.Send_WhatsApp') }}
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    .template-option.active {
        background-color: #28a745 !important;
        color: white !important;
        border-color: #28a745 !important;
    }

    #messagePreview {
        font-size: 14px;
        min-height: 120px;
    }

    .btn-outline-primary {
        color: #28a745;
        border-color: #28a745;
    }

    .btn-outline-primary:hover {
        background-color: #28a745;
        border-color: #28a745;
    }
</style>

<!-- row closed -->

<!-- WhatsApp Template Modal -->
<div class="modal fade" id="whatsappTemplateModal" tabindex="-1" role="dialog" aria-labelledby="templateModalLabel"
    aria-hidden="true">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="templateModalLabel">{{ trans('admin/attendance_trans.Select_Template') }}
                </h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="templateList">{{ trans('admin/attendance_trans.Select_Template') }}</label>
                    <div id="templateList" class="list-group">
                    </div>
                </div>

                <div class="form-group">
                    <label for="messagePreview">{{ trans('admin/attendance_trans.Message_Preview') }}:</label>
                    <textarea class="form-control" id="messagePreview" rows="5" dir="rtl"></textarea>
                </div>


                <input type="hidden" id="selectedStudentId">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">
                    {{ trans('admin/attendance_trans.Close') }}
                </button>
                <button type="button" class="btn btn-success" id="sendWhatsappBtn">
                    {{ trans('admin/attendance_trans.Send_WhatsApp') }}
                </button>
            </div>
        </div>
    </div>
</div>
@endsection
@push('scripts')
@verbatim
<script>
    function renderTemplate(templateContent, variables = {}) {
        return templateContent.replace(/{{\s*(\w+)\s*}}/g, function(match, key) {
            return variables[key] || '';
        });
    }
</script>
@endverbatim
<script>
    $(document).ready(function() {
        $('#datatable').DataTable({
            responsive: true,
            pageLength: 50,
            ordering: false, // Disable sorting to prevent cell index issues
            columnDefs: [{
                    responsivePriority: 1,
                    targets: 1
                },
                {
                    responsivePriority: 2,
                    targets: 2
                },
                {
                    responsivePriority: 4,
                    targets: 8
                }, //  even lower priority
            ],
        });
        // Modal cleanup on close
        $('#whatsappTemplateModal').on('hidden.bs.modal', function() {
            $('#messagePreview').val('');
            $('#selectedStudentId').val('');
            $('#templateList').empty();

            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
        });

        // Modal open fix
        $('#whatsappTemplateModal').on('show.bs.modal', function() {
            $('body').addClass('modal-open');
        });
    });




    // DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
        // Show WhatsApp modal and fetch templates
        $('#whatsappTemplateModal').on('show.bs.modal', function(event) {
            const button = $(event.relatedTarget);
            const studentId = button.data('student-id');
            const studentName = button.data('student-name');
            const quizNotes = button.data('quiz-notes');

            $('#selectedStudentId').val(studentId);

            // Fetch templates using jQuery AJAX
            $.ajax({
                url: '/whatsapp_templates/list_json',
                method: 'GET',
                dataType: 'json',
                success: function(templates) {
                    const templateList = $('#templateList');
                    templateList.empty();

                    templates.forEach(function(template) {
                        const btn = $(`
                    <button type="button" class="list-group-item list-group-item-action">
                        ${template.name}
                    </button>
                `);

                        btn.on('click', function() {
                            const variables = {
                                student_name: studentName,
                                notes: quizNotes
                            };

                            const message = renderTemplate(template.content, variables);
                            $('#messagePreview').val(message);
                        });

                        templateList.append(btn);
                    });
                },
                error: function(xhr, status, error) {
                    console.error("Error loading templates:", error);
                }
            });
        });

        // Handle Send WhatsApp button
        $('#sendWhatsappBtn').click(function() {
            const message = $('#messagePreview').val();
            if (!message.trim()) {
                toastr.error('الرجاء إدخال نص الرسالة');
                return;
            }

            const studentId = $('#selectedStudentId').val();
            if (!studentId) {
                console.error('No student ID found');
                toastr.error('حدث خطأ: لم يتم العثور على معرف الطالب');
                return;
            }

            const $form = $('<form>', {
                action: `{{ url('attendance_send_whatsapp') }}/${studentId}`,
                method: 'GET',
                target: '_blank'
            });

            $form.append($('<input>', {
                type: 'hidden',
                name: 'message',
                value: message
            }));

            $('body').append($form);
            $form.submit();
            $form.remove();

            $('#whatsappTemplateModal').modal('hide');
        });
    });
</script>
@endpush
