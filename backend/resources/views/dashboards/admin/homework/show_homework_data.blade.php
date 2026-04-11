@extends('layouts.master')

@section('css')
<!-- Add any custom CSS here -->
@endsection

@section('title')
{{ trans('admin/homework_trans.Edit_Homework') }}
@endsection

@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/homework_trans.Edit_Homework') }}
<!-- breadcrumb -->
@endsection


@section('content')
<!-- row -->


<x-backend.alert />



<div class="row">
    @foreach ($students as $student)
    @php
    $studentHomework = $student->homework()
    ->where('homework_id', $homework->id)
    ->where('student_id', $student->id)
    ->first();
    @endphp

@if ($studentHomework)

    <div class="col-md-6">
        <form method="POST" action="{{ route('homework.storeUpdateHomeworkDegree') }}">
            @csrf
            <div class="card mb-4 border border-primary shadow">
                <div class="card-header bg-primary text-white">
                    <strong>{{ $student->name }}</strong> - {{ $student->email }}
                </div>

                <div class="card-body">
                    {{-- Student Notes --}}
                    @if ($studentHomework && $studentHomework->student_notes)
                    <p><strong>{{ trans('admin/homework_trans.Student_Notes') }}:</strong></p>
                    <div class="alert alert-info">
                        {{ $studentHomework->student_notes }}
                    </div>
                    @endif

                    {{-- Homework Files --}}
                    @if ($studentHomework && $studentHomework->getMedia('homework_files')->count())
                    <p><strong>{{ trans('admin/homework_trans.Uploaded_Files') }}:</strong></p>
                    <div class="row">
                        @foreach ($studentHomework->getMedia('homework_files') as $media)
                        <div class="col-6 col-md-4 mb-3">
                            @php
                            $mime = $media->mime_type;
                            $isImage = Str::startsWith($mime, 'image/');
                            $isPDF = $mime === 'application/pdf';
                            $url = $media->getFullUrl();
                            @endphp

                            <div class="border p-2 text-center" style="height: 180px; overflow: hidden;">
                                @if ($isImage)
                                <a href="{{ $url }}" target="_blank">
                                    <img src="{{ $url }}" alt="{{ $media->name }}" class="img-fluid" style="max-height: 140px;">
                                </a>
                                @elseif ($isPDF)
                                <a href="{{ $url }}" target="_blank">
                                    <i class="fas fa-file-pdf fa-3x text-danger"></i>
                                    <p class="mt-1 small">{{ $media->name }}</p>
                                </a>
                                @else
                                <a href="{{ $url }}" target="_blank">
                                    <i class="fas fa-file-alt fa-3x text-primary"></i>
                                    <p class="mt-1 small">{{ $media->name }}</p>
                                </a>
                                @endif
                            </div>
                        </div>
                        @endforeach
                    </div>
                    @endif

                    <div class="form-group">
                        <label>{{ trans('admin/homework_trans.Degree') }}</label>
                        <input type="number" name="degree" class="form-control"
                            value="{{ old('degree', $studentHomework->degree ?? '') }}" step="0.1">
                    </div>

                    <div class="form-group">
                        <label>{{ trans('admin/homework_trans.Status') }}</label>
                        <select name="status" class="form-control">
                            <option value="not_submitted" {{ $studentHomework->status == 'not_submitted' ? 'selected' : '' }}>
                                {{ trans('admin/homework_trans.Not_Submitted') }}
                            </option>
                            <option value="submitted" {{ $studentHomework->status == 'submitted' ? 'selected' : '' }}>
                                {{ trans('admin/homework_trans.Submitted') }}
                            </option>
                            <option value="late" {{ $studentHomework->status == 'late' ? 'selected' : '' }}>
                                {{ trans('admin/homework_trans.Late') }}
                            </option>
                            <option value="approved" {{ $studentHomework->status == 'approved' ? 'selected' : '' }}>
                                {{ trans('admin/homework_trans.Approved') }}
                            </option>
                            <option value="rejected" {{ $studentHomework->status == 'rejected' ? 'selected' : '' }}>
                                {{ trans('admin/homework_trans.Rejected') }}
                            </option>
                        </select>
                    </div>


                    <div class="form-group">
                        <label>{{ trans('admin/homework_trans.Rate') }}</label>
                        <select name="rate" id="rate" class="form-control">

                        <option value="acceptable" {{ $studentHomework->rate == 'acceptable' ? 'selected' : '' }}>
                                {{ trans('admin/homework_trans.Acceptable') }}
                            </option>
                            <option value="good" {{ $studentHomework->rate == 'good' ? 'selected' : '' }}>
                                {{ trans('admin/homework_trans.Good') }}
                            </option>

                            <option value="very_good" {{ $studentHomework->rate == 'very_good' ? 'selected' : '' }}>
                                {{ trans('admin/homework_trans.Very_Good') }}
                            </option>

                            <option value="excellent" {{ $studentHomework->rate == 'excellent' ? 'selected' : '' }}>
                                {{ trans('admin/homework_trans.Excellent') }}
                            </option>

                        </select>
                    </div>

                    <div class="form-group">
                        <label>{{ trans('admin/homework_trans.Response') }}</label>
                        <textarea name="response" class="form-control" rows="3">{{ old('response', $studentHomework->response ?? '') }}</textarea>
                    </div>

                    {{-- Hidden fields --}}
                    <input type="hidden" name="student_id" value="{{ $student->id }}">
                    <input type="hidden" name="grade_id" value="{{ $student->grade_id }}">
                    <input type="hidden" name="class_id" value="{{ $student->class_id }}">
                    <input type="hidden" name="section_id" value="{{ $student->section_id }}">
                    <input type="hidden" name="submit_date" value="{{ $submit_date }}">
                    <input type="hidden" name="homework_id" value="{{ $homework->id }}">
                </div>

                <div class="card-footer d-flex justify-content-between">
                    @if ($student->parents->father_phone)
                    <button type="button"
                        class="btn btn-success btn-sm select-template-btn"
                        data-toggle="modal"
                        data-target="#whatsappTemplateModal"
                        data-student-id="{{ $student->id }}"
                        data-student-name="{{ $student->name }}"
                        data-homework-notes="{{ $studentHomework->student_notes ?? '' }}">
                        📲 {{ trans('admin/homework_trans.Send_WhatsApp') }}
                    </button>
                    @endif

                    <button class="btn btn-primary btn-sm" type="submit">{{ trans('admin/homework_trans.Submit') }}</button>
                </div>
            </div>
        </form>
    </div>
    @endif
    @endforeach
</div>



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
@endpush
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
                action: `{{ url('homework_send_whatsapp') }}/${studentId}`,
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
            const homeworkNotes = button.data('homework-notes');

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
                                notes: homeworkNotes
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