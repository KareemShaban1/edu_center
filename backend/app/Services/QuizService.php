<?php

declare(strict_types=1);

namespace App\Services;

final class QuizService
{
    /** @var array{table: string, date_column: string, history_name_key: string, history_label: string} */
    private const CONFIG = [
        'table' => 'quiz_degrees',
        'date_column' => 'quiz_date',
        'history_name_key' => 'quiz_name',
        'history_label' => 'Quiz',
    ];

    public function __construct(
        private readonly SectionDegreeRecordService $sectionDegreeRecordService,
    ) {}

    /**
     * @return array{date: string, session_id: ?int, session_options: \Illuminate\Support\Collection, rows: \Illuminate\Support\Collection}
     */
    public function getSectionDate(int $sectionId, string $date, ?int $filterSessionId): array
    {
        return $this->sectionDegreeRecordService->getSectionDate($sectionId, $date, $filterSessionId, self::CONFIG);
    }

    /**
     * @return array{days: \Illuminate\Support\Collection}
     */
    public function getSectionHistory(int $sectionId): array
    {
        return $this->sectionDegreeRecordService->getSectionHistory($sectionId, self::CONFIG);
    }

    /**
     * @param  array{session_id?: int|null, rows: list<array{student_id: int, status: string, degree?: ?string, notes?: ?string}>}  $payload
     */
    public function saveSectionDate(int $sectionId, string $date, array $payload): void
    {
        $this->sectionDegreeRecordService->saveSectionDate($sectionId, $date, $payload, self::CONFIG);
    }
}
