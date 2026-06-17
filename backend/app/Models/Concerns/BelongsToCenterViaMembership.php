<?php



declare(strict_types=1);



namespace App\Models\Concerns;



use App\Centers\CenterContext;

use App\Models\Platform\CenterMembership;

use Illuminate\Database\Eloquent\Builder;



/**

 * Scope profile tables (students, parents) to the active center via center_memberships.

 */

trait BelongsToCenterViaMembership

{

    public static function bootBelongsToCenterViaMembership(): void

    {

        static::addGlobalScope('center_membership', function (Builder $builder) {

            if (! CenterContext::hasCenter()) {

                return;

            }



            $table = $builder->getModel()->getTable();

            $centerId = CenterContext::id();

            $userType = static::class;



            $builder->whereIn("{$table}.id", function ($query) use ($centerId, $userType) {

                $query->from('center_memberships')

                    ->select('user_id')

                    ->where('center_id', $centerId)

                    ->where('user_type', $userType)

                    ->where('status', CenterMembership::STATUS_ASSIGNED);

            });

        });

    }

}


