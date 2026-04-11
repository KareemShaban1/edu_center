<button class="btn btn-dark btn-sm btn-lg pull-right" wire:click="showFormAdd"
    type="button">{{ trans('admin/parent_trans.Add_Parent') }}</button><br><br>
<div class="table-responsive">
    <table id="parentsTable" class="table  table-hover table-sm table-bordered p-0" data-page-length="50"
        style="text-align: center">
        <thead>
            <tr class="table-success">
                <th>#</th>
                <th>{{ trans('admin/parent_trans.Email') }}</th>
                <th>{{ trans('admin/parent_trans.Father_Name_ar') }}</th>
                <th>{{ trans('admin/parent_trans.Father_Phone') }}</th>
                <th>{{ trans('admin/parent_trans.Father_Job_ar') }}</th>
                <th>{{ trans('admin/parent_trans.Processes') }}</th>
            </tr>
        </thead>
        <tbody>
            <?php $i = 0; ?>
            @foreach ($parents as $parent)
                <tr>
                    <?php $i++; ?>
                    <td>{{ $i }}</td>
                    <td>{{ $parent->email }}</td>
                    <td>{{ $parent->father_name }}</td>
                    <td>{{ $parent->father_phone }}</td>
                    <td>{{ $parent->father_job }}</td>
                    <td>
                        <button wire:click="edit({{ $parent->id }})" title="{{ trans('Grades_trans.Edit') }}"
                            class="btn btn-warning btn-sm"><i class="fa fa-edit"></i></button>
                        <button type="button" class="btn btn-danger btn-sm" wire:click="delete({{ $parent->id }})"
                            title="{{ trans('Grades_trans.Delete') }}"><i class="fa fa-trash"></i></button>
                    </td>
                </tr>
            @endforeach
    </table>
</div>

<script type="text/javascript">
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof $ !== 'undefined' && $.fn.DataTable) {
            $('#parentsTable').DataTable({
                responsive: true,
                columnDefs: [{
                        responsivePriority: 1,
                        targets: 1
                    },
                    {
                        responsivePriority: 2,
                        targets: 2
                    },
                    {
                        responsivePriority: 3,
                        targets: 5
                    },
                ],
            });
        }
    });

    // Reinitialize DataTable for livewire update
    document.addEventListener('livewire:load', function () {
        Livewire.hook('message.processed', (message, component) => {
            if (typeof $ !== 'undefined' && $.fn.DataTable) {
                if ($.fn.DataTable.isDataTable('#parentsTable')) {
                    $('#parentsTable').DataTable().destroy();
                }
                $('#parentsTable').DataTable({
                    responsive: true,
                    columnDefs: [{
                            responsivePriority: 1,
                            targets: 1
                        },
                        {
                            responsivePriority: 2,
                            targets: 2
                        },
                        {
                            responsivePriority: 3,
                            targets: 5
                        },
                    ],
                });
            }
        });
    });
</script>
