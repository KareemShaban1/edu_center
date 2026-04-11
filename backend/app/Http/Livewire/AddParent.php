<?php

namespace App\Http\Livewire;

use App\Models\Parents;
use Illuminate\Support\Facades\Hash;
use Livewire\Component;
use Livewire\WithFileUploads;

class AddParent extends Component
{
    use WithFileUploads;

    public $successMessage = '';
    

    public $catchError, $updateMode = false, $photos, $show_table = true, $parent_id;

    public $currentStep = 1,

        // Father_INPUTS
        $email, $password,
        $father_name, $father_name_en,
        $father_phone, $father_job, $father_job_en,
        $father_address,

        // Mother_INPUTS
        $mother_name, $mother_name_en,
        $mother_phone, $mother_job, $mother_job_en,
        $mother_address;


    public function updated($propertyName)
    {
        $this->validateOnly($propertyName, [
            'email' => 'required|unique:parents,email,' . $this->id,
            'password' => 'required',
            'father_name' => 'required',
            'father_job' => 'required',
            'father_phone' => 'required|regex:/^([0-9\s\-\+\(\)]*)$/|min:10',
            'father_address' => 'required',
        ], [
            'email.required' => 'البريد الألكترونى مطلوب',
            'password.required' => ' كلمة المرور مطلوبة',
            'father_name.required' => ' أسم الأب مطلوب',
            'father_job.required' => ' وظيفة الأب مطلوب',
            'father_phone.required' => ' هاتف الأب مطلوب',
            'father_address.required' => 'عنوان الأب  مطلوب',
        ]);
    }


    public function render()
    {
        return view('dashboards.admin.livewire.add-parent', [

            'parents' => Parents::all(),
        ]);
    }

    public function showFormAdd()
    {
        $this->show_table = false;
    }



    //firstStepSubmit
    public function firstStepSubmit()
    {
        $this->validate([
            'email' => 'required|unique:parents,email,' . $this->id,
            'password' => 'required',
            'father_name' => 'required',
            'father_job' => 'required',
            'father_phone' => 'required|regex:/^([0-9\s\-\+\(\)]*)$/|min:10',
            'father_address' => 'required',
        ], [
            'email.required' => 'البريد الألكترونى مطلوب',
            'password.required' => ' كلمة المرور مطلوبة',
            'father_name.required' => ' أسم الأب مطلوب',
            'father_job.required' => ' وظيفة الأب مطلوب',
            'father_phone.required' => ' هاتف الأب مطلوب',
            'father_address.required' => 'عنوان الأب  مطلوب',
        ]);

        $this->currentStep = 2;
    }

    //secondStepSubmit
    public function secondStepSubmit()
    {

        $this->validate([
            'mother_name' => 'nullable',
            'mother_phone' => 'nullable',
            'mother_job' => 'nullable',
            'mother_address' => 'nullable',
        ]);

        $this->currentStep = 3;
    }

    public function submitForm()
    {

        try {
            $parents = new Parents();
            // Father_INPUTS
            $parents->email = $this->email;
            $parents->password = Hash::make($this->password);
            $parents->father_name = $this->father_name;
            $parents->father_phone = $this->father_phone;
            $parents->father_job = $this->father_job;
            $parents->father_address = $this->father_address;

            // Mother_INPUTS
            $parents->mother_name = $this->mother_name;
            $parents->mother_phone = $this->mother_phone;
            $parents->mother_address = $this->mother_address;
            $parents->save();

            $this->successMessage = trans('messages.success');

            $this->clearForm();

            // Trigger event to frontend
            $this->dispatchBrowserEvent('parent-added-successfully', ['message' => $this->successMessage]);

            return redirect()->to('/add_parent');


        } catch (\Exception $e) {
            $this->catchError = $e->getMessage();
        };
    }



    public function edit($id)
    {
        $this->show_table = false;
        $this->updateMode = true;

        $parents = Parents::where('id', $id)->first();

        $this->parent_id = $id;
        $this->email = $parents->email;
        // $this->password = $parents->password;
        $this->father_name = $parents->getTranslation('father_name', 'ar');
        $this->father_job = $parents->getTranslation('father_job', 'ar');;
        $this->father_phone = $parents->father_phone;
        $this->father_address = $parents->father_address;

        $this->mother_name = $parents->getTranslation('mother_name', 'ar');
        $this->mother_phone = $parents->mother_phone;
        $this->mother_address = $parents->mother_address;
    }

    //firstStepSubmit
    public function firstStepSubmit_edit()
    {
        $this->updateMode = true;
        $this->currentStep = 2;
    }

    //secondStepSubmit_edit
    public function secondStepSubmit_edit()
    {
        $this->updateMode = true;
        $this->currentStep = 3;
    }

    public function submitForm_edit()
    {
        if ($this->parent_id) {
            $parent = Parents::find($this->parent_id);
    
            $updateData = [
                'email' => $this->email,
                'father_name' => $this->father_name,
                'father_job' => $this->father_job,
                'father_phone' => $this->father_phone,
                'father_address' => $this->father_address,
                'mother_name' => $this->mother_name,
                'mother_phone' => $this->mother_phone,
                'mother_address' => $this->mother_address,
            ];
    
            // Only update password if it's filled
            if (!empty($this->password)) {
                $updateData['password'] = Hash::make($this->password);
            }
    
            $parent->update($updateData);
        }
    
        $this->successMessage = trans('messages.Update');
    
        // Trigger event to frontend
        $this->dispatchBrowserEvent('parent-added-successfully', ['message' => $this->successMessage]);
    
        return redirect()->to('/add_parent');
    }
    

    public function delete($id)
    {
        Parents::findOrFail($id)->delete();

        $this->successMessage = trans('messages.Delete');

        // Trigger event to frontend
        $this->dispatchBrowserEvent('parent-added-successfully', ['message' => $this->successMessage]);

        return redirect()->to('/add_parent');
    }


    //clearForm
    public function clearForm()
    {
        $this->email = '';
        $this->password = '';
        $this->father_name = '';
        $this->father_job = '';
        $this->father_job_en = '';
        $this->father_name_en = '';
        $this->father_phone = '';
        $this->father_address = '';

        $this->mother_name = '';
        $this->mother_job = '';
        $this->mother_job_en = '';
        $this->mother_name_en = '';
        $this->mother_phone = '';
        $this->mother_address = '';
    }


    //back
    public function back($step)
    {
        $this->currentStep = $step;
    }
}
