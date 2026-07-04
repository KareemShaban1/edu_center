<?php

namespace App\Models;

use App\Http\Support\MediaUrlHelper;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class StudentHomework extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $connection = 'center';

    protected $table = 'student_homework';

    protected $fillable = [
        'student_id', 'homework_id', 'upload_date_time', 'status',
        'degree', 'rate', 'student_notes', 'response', 'center_id',
    ];

    protected $casts = [
        'upload_date_time' => 'datetime',
    ];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('homework')->singleFile();
        $this->addMediaCollection('correction')->singleFile();
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function homework()
    {
        return $this->belongsTo(Homework::class);
    }

    public function toAdminSubmissionArray(string $studentName): array
    {
        $media = $this->getFirstMedia('homework');
        $correction = $this->getFirstMedia('correction');

        return [
            'student_id' => (int) $this->student_id,
            'student_name' => $studentName,
            'submission_id' => (int) $this->id,
            'status' => (string) $this->status,
            'degree' => $this->degree ?? '',
            'rate' => $this->rate ?? '',
            'student_notes' => $this->student_notes ?? '',
            'response' => $this->response ?? '',
            'upload_date' => $this->upload_date_time
                ? $this->upload_date_time->format('Y-m-d H:i')
                : '',
            'file_url' => MediaUrlHelper::publicPath($media),
            'file_name' => $media?->file_name,
            'correction_url' => MediaUrlHelper::publicPath($correction),
            'correction_name' => $correction?->file_name,
        ];
    }
}
