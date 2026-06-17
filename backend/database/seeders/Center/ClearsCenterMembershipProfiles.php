<?php

declare(strict_types=1);

namespace Database\Seeders\Center;

use App\Centers\CenterContext;
use App\Models\Parents;
use App\Models\Platform\CenterMembership;
use App\Models\Student;
use Illuminate\Support\Facades\DB;

trait ClearsCenterMembershipProfiles
{
    protected function clearProfilesForCenter(string $table, string $userType): void
    {
        $centerId = CenterContext::id();

        if (! $centerId) {
            DB::connection('center')->table($table)->delete();

            return;
        }

        $profileIds = CenterMembership::query()
            ->where('center_id', $centerId)
            ->where('user_type', $userType)
            ->pluck('user_id');

        if ($profileIds->isNotEmpty()) {
            DB::connection('center')->table($table)->whereIn('id', $profileIds)->delete();
        }

        CenterMembership::query()
            ->where('center_id', $centerId)
            ->where('user_type', $userType)
            ->delete();
    }
}
