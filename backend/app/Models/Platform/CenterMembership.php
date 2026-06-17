<?php

declare(strict_types=1);

namespace App\Models\Platform;

use App\Models\Parents;
use App\Models\Student;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class CenterMembership extends Model
{
    public const ROLE_PARENT = 'parent';

    public const ROLE_STUDENT = 'student';

    public const STATUS_ASSIGNED = 'assigned';

    public const STATUS_NOT_ASSIGNED = 'not_assigned';

    protected $table = 'center_memberships';

    protected $fillable = [
        'center_id',
        'user_id',
        'user_type',
        'status',
    ];

    public static function userTypeForGuard(string $authGuard): string
    {
        return $authGuard === 'student' ? Student::class : Parents::class;
    }

    public static function guardForUserType(string $userType): string
    {
        return $userType === Student::class ? 'student' : 'parent';
    }

    public static function roleForUserType(string $userType): string
    {
        return $userType === Student::class ? self::ROLE_STUDENT : self::ROLE_PARENT;
    }

    public function profile(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'user_type', 'user_id');
    }

    public function center(): BelongsTo
    {
        return $this->belongsTo(Center::class, 'center_id');
    }

    public function isAssigned(): bool
    {
        return $this->status === self::STATUS_ASSIGNED;
    }
}
