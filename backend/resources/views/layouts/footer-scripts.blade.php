<script>
    const userId = "{{ Auth::id() }}";
    const parentId = "{{ auth()->guard('parent')->id() }}";

</script>

<!-- jquery -->
<script src="{{ asset('assets/js/jquery-3.3.1.min.js') }}"></script>
<script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.6.0/dist/umd/popper.min.js"></script>


<!-- app.js -->
<script src="{{ asset('assets/js/bootstrap.min.js') }}"></script>

<!-- plugins-jquery -->
<script src="{{ asset('assets/js/plugins-jquery.js') }}"></script>

<!-- plugin_path -->
<script>
    var plugin_path = '{{ asset('assets/js/') }}';
</script>

<!-- app.js -->

<!-- calendar -->
{{-- <script src="{{ asset('assets/js/calendar.init.js') }}"></script> --}}

<!-- datepicker -->
<script src="{{ asset('assets/js/datepicker.js') }}"></script>


@yield('js')
<script src="{{ asset('assets/js/toastr.js') }}"></script>

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>


<script>
    @if(session('toast_success') || !empty($successMessage))
    toastr.success("{{ session('toast_success') }}", "", {
        "timeOut": 1000
    }); // Set timeOut to 1000 milliseconds (1 second)
    @endif
    @if(session('toast_error'))
    toastr.error("{{ session('toast_error') }}", "", {
        "timeOut": 1000
    }); // Set timeOut to 1000 milliseconds (1 second)
    @endif
</script>


<script src="{{ asset('assets/js/custom.js') }}"></script>


<script src="{{ mix('js/app.js') }}"></script>


@if (App::getLocale() == 'en')
    <script src="{{ asset('assets/js/bootstrap-datatables/en/jquery.dataTables.min.js') }}"></script>
    <script src="{{ asset('assets/js/bootstrap-datatables/en/dataTables.bootstrap4.min.js') }}"></script>
@else
    <script src="{{ asset('assets/js/bootstrap-datatables/ar/jquery.dataTables.min.js') }}"></script>
    <script src="{{ asset('assets/js/bootstrap-datatables/ar/dataTables.bootstrap4.min.js') }}"></script>
@endif


<script src="{{ asset('assets/js/bootstrap-datatables/dataTables.responsive.min.js') }}"></script>



<script>
    $(document).ready(function() {

        // $('#datatable').DataTable();

        $('select[name="grade_id"]').on('change', function() {
            var grade_id = $(this).val();
            // console.log(grade_id);
            if (grade_id) {
                $.ajax({
                    url: "{{ URL::to('Get_Classes') }}/" + grade_id,
                    type: "GET",
                    dataType: "json",
                    success: function(data) {
                        $('select[name="class_id"]').empty();
                        $('select[name="class_id"]').append(
                            '<option selected disabled >{{ trans('admin/online_classes_trans.Choose') }}...</option>'
                        );
                        $.each(data, function(key, value) {
                            $('select[name="class_id"]').append('<option value="' +
                                key + '">' + value + '</option>');
                        });

                    },
                });
            } else {
                console.log('AJAX load did not work');
            }
        });

        $('select[name="class_id"]').on('change', function() {
            var class_id = $(this).val();
            var grade_id = $('select[name="grade_id"]').val();

            if (class_id) {
                $.ajax({
                    url: "{{ URL::to('Get_Sections') }}/" + class_id + "/" + grade_id,
                    type: "GET",
                    dataType: "json",
                    success: function(data) {
                        $('select[name="section_id"]').empty();
                        $.each(data, function(key, value) {
                            console.log(key);
                            $('select[name="section_id"]').append(
                                '<option value="' + key + '">' + value +
                                '</option>');
                        });
                    },
                });
            } else {
                console.log('AJAX load did not work');
            }
        });
    });
</script>

@stack('scripts')


@livewireScripts

