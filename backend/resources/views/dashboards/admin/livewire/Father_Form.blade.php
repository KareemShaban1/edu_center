@if ($currentStep != 1)
    <div style="display: none" class="row setup-content" id="step-1">
@endif

<x-backend.alert />

<div class="col-xs-12">
    <div class="col-md-12">
        <br>
        <div class="form-row">
            <div class="col-12">
                <label for="email">{{ trans('admin/parent_trans.Email') }}</label>
                <input type="email" value="{{ old('email') }}" wire:model="email" id="email" class="form-control">

            </div>
            <div class="col-12">
                <label for="password">{{ trans('admin/parent_trans.Password') }}</label>
                <input type="password" wire:model="password" id="password" class="form-control">
            </div>
        </div>

        <div class="form-row">
            <div class="col-12 col-md-3">
                <label for="father_name">{{ trans('admin/parent_trans.Father_Name_ar') }}</label>
                <input type="text" value="{{ old('father_name') }}" id="father_name" wire:model="father_name" class="form-control">

            </div>
            <div class="col-12 col-md-3">
                <label for="father_job">{{ trans('admin/parent_trans.Father_Job_ar') }}</label>
                <input type="text" value="{{ old('father_job') }}" wire:model="father_job" id="father_job" class="form-control">

            </div>



            <div class="col-md-3">
                <label for="father_phone">{{ trans('admin/parent_trans.Father_Phone') }}</label>
                <input type="text" value="{{ old('father_phone') }}" wire:model="father_phone" id="father_phone" class="form-control">

            </div>

        </div>


        <div class="form-group">
            <label for="father_address">{{ trans('admin/parent_trans.Father_Address') }}</label>
            <textarea class="form-control" value="{{ old('father_address') }}" wire:model="father_address" id="father_address" rows="4"></textarea>

        </div>

        @if ($updateMode)
            <button class="btn btn-success btn-sm nextBtn btn-lg pull-right" wire:click="firstStepSubmit_edit"
                type="button">{{ trans('admin/parent_trans.Next') }}
            </button>
        @else
            <button class="btn btn-success btn-sm nextBtn btn-lg pull-right" wire:click="firstStepSubmit"
                type="button">{{ trans('admin/parent_trans.Next') }}
            </button>
        @endif

    </div>
</div>
</div>
