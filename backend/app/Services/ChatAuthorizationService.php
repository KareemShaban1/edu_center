<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Parents;
use App\Models\Platform\Center;
use App\Models\Platform\CenterMembership;
use App\Models\Student;
use App\Support\Chat\ChatActor;
use App\Support\Chat\ChatIdentity;
use App\Support\Chat\ChatScope;
use Illuminate\Support\Facades\DB;

class ChatAuthorizationService
{
    public static function pairAllowed(string $typeA, string $typeB): bool
    {
        if ($typeA === $typeB && ($typeA === ChatActor::TYPE_STUDENT || $typeA === ChatActor::TYPE_PARENT)) {
            return false;
        }

        $aStaff = in_array($typeA, ChatActor::STAFF_TYPES, true);
        $bStaff = in_array($typeB, ChatActor::STAFF_TYPES, true);

        return $aStaff || $bStaff;
    }

    public static function canCreateGroup(string $type): bool
    {
        return in_array($type, ChatActor::STAFF_TYPES, true);
    }

    public function belongsToCenter(ChatActor $actor, int $centerId): bool
    {
        return in_array($centerId, $actor->centerIds(), true);
    }

    public function canDirectChat(ChatActor $actor, string $peerType, int $peerId, int $centerId): bool
    {
        if (! $this->belongsToCenter($actor, $centerId)) {
            return false;
        }

        if (! self::pairAllowed($actor->type, $peerType)) {
            return false;
        }

        $identity = $actor->identityForCenter($centerId);
        if ($identity && $identity->type === $peerType && $identity->id === $peerId) {
            return false;
        }

        return $this->peerBelongsToCenter($peerType, $peerId, $centerId);
    }

    public function canAccessCenterAsMember(ChatActor $actor, int $centerId): bool
    {
        return $this->belongsToCenter($actor, $centerId);
    }

    public function peerBelongsToCenter(string $type, int $id, int $centerId): bool
    {
        return (bool) ChatScope::withoutCenter(function () use ($type, $id, $centerId) {
            return match ($type) {
                ChatActor::TYPE_ADMIN => DB::connection('center')->table('users')
                    ->where('id', $id)
                    ->where('center_id', $centerId)
                    ->exists(),
                ChatActor::TYPE_TEACHER => DB::connection('center')->table('teachers')
                    ->where('id', $id)
                    ->where('center_id', $centerId)
                    ->exists(),
                ChatActor::TYPE_STUDENT => CenterMembership::query()
                    ->where('user_type', Student::class)
                    ->where('user_id', $id)
                    ->where('center_id', $centerId)
                    ->where('status', CenterMembership::STATUS_ASSIGNED)
                    ->exists(),
                ChatActor::TYPE_PARENT => $this->parentBelongsToCenter($id, $centerId),
                default => false,
            };
        });
    }

    private function parentBelongsToCenter(int $parentId, int $centerId): bool
    {
        $own = CenterMembership::query()
            ->where('user_type', Parents::class)
            ->where('user_id', $parentId)
            ->where('center_id', $centerId)
            ->where('status', CenterMembership::STATUS_ASSIGNED)
            ->exists();

        if ($own) {
            return true;
        }

        $childQuery = DB::connection('center')->table('students')->where('parent_id', $parentId);
        if (DB::connection('center')->getSchemaBuilder()->hasColumn('students', 'deleted_at')) {
            $childQuery->whereNull('deleted_at');
        }
        $childIds = $childQuery->pluck('id')->map(fn ($id) => (int) $id)->all();
        if ($childIds === []) {
            return false;
        }

        return CenterMembership::query()
            ->where('user_type', Student::class)
            ->whereIn('user_id', $childIds)
            ->where('center_id', $centerId)
            ->where('status', CenterMembership::STATUS_ASSIGNED)
            ->exists();
    }

    /**
     * @return list<array{type: string, id: int, center_id: int, center_name: string|null, name: string, role: string}>
     */
    public function listContacts(ChatActor $actor, ?string $search = null, ?int $centerId = null): array
    {
        $centerIds = $centerId ? [$centerId] : $actor->centerIds();
        $centerIds = array_values(array_intersect($centerIds, $actor->centerIds()));
        if ($centerIds === []) {
            return [];
        }

        $search = is_string($search) ? trim($search) : '';
        if (mb_strlen($search) < 3) {
            return [];
        }

        return ChatScope::withoutCenter(function () use ($actor, $centerIds, $search) {
            $centerNames = Center::query()->whereIn('id', $centerIds)->pluck('name', 'id');
            $contacts = [];

            if ($actor->isStaff()) {
                $contacts = array_merge(
                    $contacts,
                    $this->mapStaffRows('users', ChatActor::TYPE_ADMIN, $centerIds, $centerNames, $search, 'name'),
                    $this->mapStaffRows('teachers', ChatActor::TYPE_TEACHER, $centerIds, $centerNames, $search, 'name'),
                    $this->mapMembershipRows(Student::class, ChatActor::TYPE_STUDENT, $centerIds, $centerNames, $search, 'students', 'name'),
                    $this->mapMembershipRows(Parents::class, ChatActor::TYPE_PARENT, $centerIds, $centerNames, $search, 'parents', 'parent_name'),
                );
            } else {
                $contacts = array_merge(
                    $contacts,
                    $this->mapStaffRows('users', ChatActor::TYPE_ADMIN, $centerIds, $centerNames, $search, 'name'),
                    $this->mapStaffRows('teachers', ChatActor::TYPE_TEACHER, $centerIds, $centerNames, $search, 'name'),
                );
            }

            $selfIds = $actor->ids();
            $filtered = [];
            foreach ($contacts as $contact) {
                if ($contact['type'] === $actor->type && in_array($contact['id'], $selfIds, true)) {
                    continue;
                }
                if (! self::pairAllowed($actor->type, $contact['type'])) {
                    continue;
                }
                $filtered[] = $contact;
            }

            usort($filtered, static function (array $a, array $b): int {
                return [$a['center_name'] ?? '', $a['role'], $a['name']] <=> [$b['center_name'] ?? '', $b['role'], $b['name']];
            });

            return array_slice(array_values($filtered), 0, 30);
        });
    }

    /**
     * @param  list<int>  $centerIds
     * @param  \Illuminate\Support\Collection<int|string, mixed>  $centerNames
     * @return list<array{type: string, id: int, center_id: int, center_name: string|null, name: string, role: string}>
     */
    private function mapStaffRows(string $table, string $type, array $centerIds, $centerNames, string $search, string $nameColumn): array
    {
        $query = DB::connection('center')->table($table)->whereIn('center_id', $centerIds);
        if ($search !== '') {
            $query->where($nameColumn, 'like', '%'.addcslashes($search, '%_\\').'%');
        }
        $query->orderBy($nameColumn)->limit(20);

        $out = [];
        foreach ($query->get(['id', $nameColumn.' as display_name', 'center_id']) as $row) {
            $centerId = (int) $row->center_id;
            $out[] = [
                'type' => $type,
                'id' => (int) $row->id,
                'center_id' => $centerId,
                'center_name' => $centerNames[$centerId] ?? null,
                'name' => (string) ($row->display_name ?? ''),
                'role' => $type,
            ];
        }

        return $out;
    }

    /**
     * @param  list<int>  $centerIds
     * @param  \Illuminate\Support\Collection<int|string, mixed>  $centerNames
     * @return list<array{type: string, id: int, center_id: int, center_name: string|null, name: string, role: string}>
     */
    private function mapMembershipRows(
        string $userType,
        string $type,
        array $centerIds,
        $centerNames,
        string $search,
        string $table,
        string $nameColumn,
    ): array {
        $profileQuery = DB::connection('center')->table($table)
            ->join('center_memberships', function ($join) use ($table, $userType, $centerIds) {
                $join->on('center_memberships.user_id', '=', $table.'.id')
                    ->where('center_memberships.user_type', '=', $userType)
                    ->whereIn('center_memberships.center_id', $centerIds)
                    ->where('center_memberships.status', '=', CenterMembership::STATUS_ASSIGNED);
            });
        if ($table === 'students' && DB::connection('center')->getSchemaBuilder()->hasColumn('students', 'deleted_at')) {
            $profileQuery->whereNull($table.'.deleted_at');
        }
        if ($search !== '') {
            $profileQuery->where($table.'.'.$nameColumn, 'like', '%'.addcslashes($search, '%_\\').'%');
        }
        $profiles = $profileQuery
            ->orderBy($table.'.'.$nameColumn)
            ->limit(40)
            ->get([$table.'.id', $table.'.'.$nameColumn.' as display_name'])
            ->unique('id')
            ->keyBy('id');

        if ($profiles->isEmpty()) {
            return [];
        }

        $memberships = CenterMembership::query()
            ->where('user_type', $userType)
            ->whereIn('center_id', $centerIds)
            ->whereIn('user_id', $profiles->keys()->all())
            ->where('status', CenterMembership::STATUS_ASSIGNED)
            ->get();
        $out = [];
        foreach ($memberships as $membership) {
            $profile = $profiles->get($membership->user_id);
            if (! $profile) {
                continue;
            }
            $centerId = (int) $membership->center_id;
            $out[] = [
                'type' => $type,
                'id' => (int) $membership->user_id,
                'center_id' => $centerId,
                'center_name' => $centerNames[$centerId] ?? null,
                'name' => (string) ($profile->display_name ?? ''),
                'role' => $type,
            ];
        }

        return $out;
    }

    public function loadPeerActor(string $type, int $id, int $centerId): ?ChatActor
    {
        if (! $this->peerBelongsToCenter($type, $id, $centerId)) {
            return null;
        }

        return ChatScope::withoutCenter(function () use ($type, $id, $centerId) {
            $name = '';
            $email = null;
            if ($type === ChatActor::TYPE_ADMIN) {
                $row = DB::connection('center')->table('users')->where('id', $id)->first(['name', 'email']);
                $name = (string) ($row->name ?? '');
                $email = isset($row->email) ? (string) $row->email : null;
            } elseif ($type === ChatActor::TYPE_TEACHER) {
                $row = DB::connection('center')->table('teachers')->where('id', $id)->first(['name', 'email']);
                $name = (string) ($row->name ?? '');
                $email = isset($row->email) ? (string) $row->email : null;
            } elseif ($type === ChatActor::TYPE_STUDENT) {
                $row = DB::connection('center')->table('students')->where('id', $id)->first(['name', 'email']);
                $name = (string) ($row->name ?? '');
                $email = isset($row->email) ? (string) $row->email : null;
            } elseif ($type === ChatActor::TYPE_PARENT) {
                $row = DB::connection('center')->table('parents')->where('id', $id)->first(['parent_name', 'email']);
                $name = (string) ($row->parent_name ?? '');
                $email = isset($row->email) ? (string) $row->email : null;
            } else {
                return null;
            }

            return new ChatActor(
                $type,
                $name,
                $email,
                [new ChatIdentity($type, $id, $centerId)],
            );
        });
    }
}
