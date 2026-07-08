<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToCenter;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentCertification extends Model
{
    use BelongsToCenter;
    use HasFactory;

    protected $connection = 'center';

    protected $table = 'student_certifications';

    protected $fillable = [
        'template_id',
        'student_id',
        'section_id',
        'title',
        'content',
        'variables',
        'design',
        'context',
        'context_date',
        'issued_at',
        'issued_by',
        'is_custom',
    ];

    protected $casts = [
        'variables' => 'array',
        'design' => 'array',
        'context_date' => 'date',
        'issued_at' => 'datetime',
        'is_custom' => 'boolean',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(CertificationTemplate::class, 'template_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'section_id');
    }
}
