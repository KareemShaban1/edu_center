@if ($currentStep != 2)
    <div style="display: none" class="row setup-content" id="step-2">
@endif
<x-backend.alert />

<div class="col-xs-12">
    <div class="col-md-12">
        <br>

        <div class="form-row">
            <div class="col-12">
                <label for="mother_name">{{ trans('admin/parent_trans.Mother_Name_ar') }}</label>
                <input type="text" value="{{ old('mother_name') }}" id="mother_name" wire:model="mother_name" class="form-control">

            </div>

        </div>

        <div class="form-row">
            <div class="col-12 col-md-3">
                <label for="mother_job">{{ trans('admin/parent_trans.Mother_Job_ar') }}</label>
                <input type="text" value="{{ old('mother_job') }}" id="mother_job" wire:model="mother_job" class="form-control">

            </div>

            <div class="col-12 col-md-3">
                <label for="mother_phone">{{ trans('admin/parent_trans.Mother_Phone') }}</label>
                <input type="text" value="{{ old('mother_phone') }}" id="mother_phone" wire:model="mother_phone" class="form-control">

            </div>

        </div>


        <div class="form-group">
            <label for="mother_address">{{ trans('admin/parent_trans.Mother_Address') }}</label>
            <textarea class="form-control" value="{{ old('mother_address') }}" wire:model="mother_address" id="mother_address" rows="4"></textarea>

        </div>

        <button class="btn btn-danger btn-sm nextBtn btn-lg pull-right" type="button" wire:click="back(1)">
            {{ trans('admin/parent_trans.Back') }}
        </button>

        @if ($updateMode)
            <button class="btn btn-success btn-sm nextBtn btn-lg pull-right" wire:click="secondStepSubmit_edit"
                type="button">{{ trans('admin/parent_trans.Next') }}
            </button>
        @else
            <button class="btn btn-success btn-sm nextBtn btn-lg pull-right" type="button"
                wire:click="secondStepSubmit">{{ trans('admin/parent_trans.Next') }}</button>
        @endif

    </div>
</div>
</div>
