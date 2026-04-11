<?php

namespace App\Imports;

use App\Events\ImportProgressEvent;
use App\Models\Parents;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Illuminate\Contracts\Queue\ShouldQueue;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Validators\Failure;

class ParentsImport implements
    ToCollection,
    WithHeadingRow,
    WithValidation,
    SkipsEmptyRows,
    // ShouldQueue,
    WithChunkReading,
    SkipsOnFailure,
    WithBatchInserts
{
    use Importable, SkipsFailures;

    public $imported = [];
    public $skipped = [];

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            if (Parents::where('email', $row['email'])->exists()) {
                $this->skipped[] = [
                    'email' => $row['email'],
                    'reason' => 'Email already exists',
                ];
                continue;
            }

            $this->imported[] = Parents::create([
                'email'            => $row['email'],
                'password'         => bcrypt($row['password']),
                'parent_name'      => $row['parent_name'],
                'parent_phone'     => $row['parent_phone'] ?? null,
                'parent_job'       => $row['parent_job'] ?? null,
                'parent_address'   => $row['parent_address'] ?? null,
                'is_active'        => isset($row['is_active']) ? (bool)$row['is_active'] : true,
                'notes'            => $row['notes'] ?? null,
            ]);

            // event(new ImportProgressEvent(
            //     count($this->imported) + count($this->skipped),
            //     count($this->imported),
            //     count($this->skipped)
            // ));
        }
    }

    public function rules(): array
    {
        return [
            '*.email'        => 'required|email|unique:parents,email',
            '*.password'     => 'required|min:6',
            '*.parent_name'  => 'required|string|max:255',
            '*.parent_phone' => 'nullable|max:20',
            '*.is_active'    => 'nullable|boolean',
        ];
    }

    public function onFailure(Failure ...$failures)
    {
        foreach ($failures as $failure) {
            $this->skipped[] = [
                'row' => $failure->row(),
                'errors' => $failure->errors(),
                'values' => $failure->values(),
            ];
        }
    }

    public function batchSize(): int
    {
        return 100;
    }

    public function chunkSize(): int
    {
        return 100;
    }
}