<?php


namespace App\Imports;

use App\Models\Classes;
use App\Models\Student;
use App\Models\Grade;
use App\Models\Section;
use App\Models\Parents;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Illuminate\Contracts\Queue\ShouldQueue;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Validators\Failure;

class StudentsImport implements
    ToCollection,
    WithHeadingRow,
    WithValidation,
    SkipsEmptyRows,
    WithChunkReading,
    SkipsOnFailure
{
    use SkipsFailures;

    public $imported = [];
    public $skipped = [];

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            // ✅ Skip if email already exists
            if (Student::where('email', $row['email'])->exists()) {
                $this->skipped[] = [
                    'email' => $row['email'],
                    'reason' => 'Email already exists',
                ];
                continue;
            }
    
            // ✅ Lookups
            $gradeId   = Grade::where('grade_name', $row['grade_name'])->value('id');
            $classId   = Classes::where('class_name', $row['class_name'])->value('id');
            $sectionId = Section::where('section_name', $row['section_name'])->value('id');
            $parentId  = Parents::where('parent_name', $row['parent_name'])->value('id');
    
            // ✅ If any FK missing → skip this row
            if (!$gradeId || !$classId || !$sectionId || !$parentId) {
                $this->skipped[] = [
                    'email'  => $row['email'],
                    'reason' => 'Missing foreign key (grade/class/section/parent)',
                    'values' => $row->toArray(),
                ];
                continue;
            }
    
            // ✅ Create Student
            $student = Student::create([
                'name'             => $row['name'],
                'email'            => $row['email'],
                'password'         => bcrypt($row['password']),
                'gender'           => strtolower($row['gender']) === 'female' ? 'female' : 'male',
                'grade_id'         => $gradeId,
                'class_id'         => $classId,
                'section_id'       => $sectionId,
                'parent_id'        => $parentId,
                'is_active'        => isset($row['is_active']) ? (bool)$row['is_active'] : true,
                'academic_year'    => $row['academic_year'],
                'notes'            => $row['notes'] ?? null,
                'push_subscription'=> $row['push_subscription'] ?? null,
            ]);

            $this->imported[] = $student;
        }
    }
    

    public function rules(): array
    {
        return [
            '*.name'          => 'required|string|max:255',
            '*.email'         => 'required|email|unique:students,email',
            '*.password'      => 'required|min:6',
            '*.gender'        => 'required|in:male,female',

            '*.grade_name'    => 'nullable|string|exists:grades,grade_name',
            '*.class_name'    => 'nullable|string|exists:classes,class_name',
            '*.section_name'  => 'nullable|string|exists:sections,section_name',
            '*.parent_name'   => 'nullable|string|exists:parents,parent_name',

            '*.academic_year' => 'required|max:50',
            '*.is_active'     => 'nullable|boolean',
        ];
    }

    // ✅ Handle validation failures
    public function onFailure(Failure ...$failures)
    {
        foreach ($failures as $failure) {
            $this->skipped[] = [
                'row'    => $failure->row(),
                'errors' => $failure->errors(),
                'values' => $failure->values(),
            ];
        }
    }

    public function chunkSize(): int
    {
        return 100;
    }
}
