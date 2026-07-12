<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Parents;
use App\Models\Student;
use Illuminate\Support\Facades\Schema;

class StudentWhatsAppContactResolver
{
    public function __construct(
        private readonly WhatsAppLinkService $whatsAppLinks,
    ) {}

    public function canContact(?Student $student): bool
    {
        return $this->resolve($student) !== null;
    }

    /**
     * @return array{type: 'student'|'parent', model: Student|Parents, phone: string}|null
     */
    public function resolve(?Student $student): ?array
    {
        if (! $student) {
            return null;
        }

        $studentsHavePhone = Schema::connection('center')->hasColumn('students', 'phone');

        if ($studentsHavePhone && ! empty(trim((string) $student->phone))) {
            $phone = $this->whatsAppLinks->normalizePhone((string) $student->phone);
            if ($phone !== null) {
                return [
                    'type' => 'student',
                    'model' => $student,
                    'phone' => $phone,
                ];
            }
        }

        if (! empty($student->parent_id)) {
            $parent = Parents::query()->find($student->parent_id);
            if ($parent && ! empty(trim((string) $parent->parent_phone))) {
                $phone = $this->whatsAppLinks->normalizePhone((string) $parent->parent_phone);
                if ($phone !== null) {
                    return [
                        'type' => 'parent',
                        'model' => $parent,
                        'phone' => $phone,
                    ];
                }
            }
        }

        return null;
    }

    /**
     * @param  iterable<int, Student>  $students
     * @return array<int, bool>
     */
    public function canContactMap(iterable $students): array
    {
        $map = [];
        foreach ($students as $student) {
            $map[(int) $student->getKey()] = $this->canContact($student);
        }

        return $map;
    }
}
