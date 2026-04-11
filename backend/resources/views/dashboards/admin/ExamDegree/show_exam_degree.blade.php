@extends('layouts.master')
@section('css')
@section('title')
{{ trans('admin/exams_trans.Edit_Exam_Degree') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/exams_trans.Edit_Exam_Degree') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->


<x-backend.alert />


<h5 style="font-family: 'Cairo', sans-serif;color: red"> {{ trans('admin/exams_trans.Today_Date') }}:
    {{ $exam_date }}
</h5>
<div style="margin-bottom: 30px; color:rgb(164, 16, 16); font-weight:bold">
    {{ $section->grade->grade_name }} / {{ $section->class->class_name }} / {{ $section->section_name }}
</div>
<form method="post" action="{{ route('ExamDegree.storeUpdateExamDegree') }}">

    <div class="row mb-4">
        <div class="col-md-6">
            <div class="form-group">
                <label for="final_degree" class="font-weight-bold">{{ trans('admin/exams_trans.Final_Degree') }} <span
                        class="text-danger">*</span></label>
                <input type="number" class="form-control @error('final_degree') is-invalid @enderror" id="final_degree"
                    name="final_degree" min="0" required
                    value="{{ $exams->first()->final_degree ?? old('final_degree') }}"
                    placeholder="{{ trans('admin/exams_trans.Enter_Final_Degree') }}">
                @error('final_degree')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>
        </div>
    </div>
    @csrf
    <div class="table-responsive">
        <table id="datatable" class="table  table-hover table-sm table-bordered p-0" data-page-length="50"
            style="text-align: center">

            <thead>
                <tr>
                    <th class="alert-success">#</th>
                    <th class="alert-success">{{ trans('admin/exams_trans.Student_Name') }}</th>
                    <th class="alert-success">{{ trans('admin/exams_trans.Email') }}</th>
                    <th class="alert-success">{{ trans('admin/exams_trans.Gender') }}</th>
                    <th class="alert-success">{{ trans('admin/exams_trans.Grade') }}</th>
                    <th class="alert-success">{{ trans('admin/exams_trans.Class') }}</th>
                    <th class="alert-success">{{ trans('admin/exams_trans.Section') }}</th>
                    <th class="alert-success">{{ trans('admin/exams_trans.Degree') }}</th>
                    <th class="alert-success">{{ trans('admin/exams_trans.Notes') }}</th>
                    <th class="alert-success">{{ trans('admin/exams_trans.Notifications') }}</th>

                </tr>
            </thead>
            <tbody>
                @forelse ($students as $student)
                @php
                $student_exam = $student->exam()->where('student_id', $student->id)->where('exam_date', $exam_date)
                ->first();

                @endphp
                <tr>
                    <input type="hidden" name="exam_date[]" value="{{ $exam_date }}">
                    <input type="hidden" name="student_id[]" value="{{ $student->id }}">
                    <input type="hidden" name="grade_id[]" value="{{ $student->grade_id }}">
                    <input type="hidden" name="class_id[]" value="{{ $student->class_id }}">
                    <input type="hidden" name="section_id[]" value="{{ $student->section_id }}">


                    <td>{{ $loop->index + 1 }}</td>
                    <td>{{ $student->name }}</td>
                    <td>{{ $student->email }}</td>
                    <td>{{ $student->gender }}</td>
                    <td>{{ $student->grade->grade_name }}</td>
                    <td>{{ $student->class->class_name }}</td>
                    <td>{{ $student->section->section_name }}</td>
                    <td>
                        <input type="text" name="degree[]"
                            value="{{ old('degree[]', $student->exam()->where('student_id', $student->id)->where('exam_date', $exam_date)->value('degree')) }}"
                            class="form-control">
                    </td>
                    <td>
                        <input type="text" name="notes[]"
                            value="{{ old('notes[]', $student->exam()->where('student_id', $student->id)->where('exam_date', $exam_date)->value('notes')) }}"
                            class="form-control">
                    </td>


                    <td>

                        @if ($student->parents->father_phone)
                        <button type="button"
                            class="btn btn-success btn-sm mt-1 select-template-btn"
                            data-toggle="modal" data-target="#whatsappTemplateModal"
                            data-student-id="{{ $student->id }}"
                            data-student-name="{{ $student->name }}"
                            data-exam-notes="{{ $student_exam->notes ?? '' }}">
                            📲 {{ trans('admin/exams_trans.Send_WhatsApp') }}
                        </button>



                        @endif
                </tr>
                @empty

                <div class="col-md-12 col-12">
                    <div style="text-align: center; font-size:30px">
                        {{ trans('admin/exams_trans.No_Student_Exist') }}
                    </div>
                    <div style="display: flex; justify-content: center;" class="col-12 col-md-12">
                        <img src="{{ asset('images/icons/not_found.webp') }}" height="300" width="300"
                            alt="">
                    </div>
                </div>
                @endforelse
            </tbody>
        </table>

        <button class="btn btn-success" type="submit">{{ trans('admin/exams_trans.Submit') }}</button>

    </div>



</form>


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

<!-- row closed -->
@endsection

@verbatim
<script>
    function renderTemplate(templateContent, variables = {}) {
        return templateContent.replace(/{{\s*(\w+)\s*}}/g, function(match, key) {
            return variables[key] || '';
        });
    }
</script>
@endverbatim

@push('scripts')
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
                    targets: 7
                },
                {
                    responsivePriority: 3,
                    targets: 8
                }
            ]
        });

        let currentStudentData = null;
        let selectedTemplate = 'default';

        $('[data-toggle="tooltip"]').tooltip();

        $(document).on('click', '.whatsapp-btn', function() {
            $('.template-option').removeClass('active');

            currentStudentData = {
                id: $(this).data('student-id'),
                name: $(this).data('student-name'),
                degree: $(this).data('degree'),
                notes: $(this).data('notes')
            };

            if (!currentStudentData.id || !currentStudentData.name) {
                console.error('Invalid student data');
                toastr.error('بيانات الطالب غير صحيحة');
                return;
            }

            $('#selectedStudentId').val(currentStudentData.id);
            $('.template-option[data-template="default"]').addClass('active');
            selectedTemplate = 'default';
            loadTemplate('default');
            $('#whatsappTemplateModal').modal('show');
        });

        $('.template-option').click(function() {
            $('.template-option').removeClass('active');
            $(this).addClass('active');
            selectedTemplate = $(this).data('template');
            loadTemplate(selectedTemplate);
        });

        function loadTemplate(templateType) {
            try {
                if (!currentStudentData || !currentStudentData.name) {
                    console.error('No student data available');
                    toastr.error('بيانات الطالب غير متوفرة');
                    return;
                }

                let template = '';
                let isReadOnly = true;

                switch (templateType) {
                    case 'default':
                        template =
                            `السلام عليكم، نود إعلامكم بأن الطالب/ة ${currentStudentData.name} حصل على درجة ${currentStudentData.degree} في الامتحان.`;
                        break;

                    case 'with-notes':
                        template =
                            `السلام عليكم، نود إعلامكم بأن الطالب/ة ${currentStudentData.name} حصل على درجة ${currentStudentData.degree} في الامتحان.`;
                        if (currentStudentData.notes && currentStudentData.notes.trim()) {
                            template += `\nملاحظات: ${currentStudentData.notes}`;
                        }
                        break;

                    case 'custom':
                        template = $('#messagePreview').val() ||
                            `السلام عليكم،\nاسم الطالب/ة: ${currentStudentData.name}\nالدرجة: ${currentStudentData.degree}`;
                        isReadOnly = false;
                        break;

                    default:
                        console.error('Invalid template type:', templateType);
                        return;
                }

                const $messagePreview = $('#messagePreview');
                $messagePreview
                    .val(template)
                    .prop('readonly', isReadOnly)
                    .css('background-color', isReadOnly ? '#f8f9fa' : '#ffffff');

                if (!isReadOnly) {
                    setTimeout(() => $messagePreview.focus(), 100);
                }

            } catch (error) {
                console.error('Error loading template:', error);
                toastr.error('حدث خطأ أثناء تحميل القالب');
            }
        }

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
                action: `{{ url('exam_send_whatsapp') }}/${studentId}`,
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

        $('#whatsappTemplateModal').on('hidden.bs.modal', function() {
            $('#messagePreview').val('');
            $('#selectedStudentId').val('');
            currentStudentData = null;
            selectedTemplate = 'default';
        });

        $('#whatsappTemplateModal').on('show.bs.modal', function() {
            $('body').addClass('modal-open');
        });

        $('.modal .close, .modal .btn-secondary').click(function() {
            $('#whatsappTemplateModal').modal('hide');
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
            const examNotes = button.data('exam-notes');

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
                                notes: examNotes
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