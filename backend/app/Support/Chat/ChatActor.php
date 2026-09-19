<?php

declare(strict_types=1);

namespace App\Support\Chat;

final class ChatActor
{
    public const TYPE_ADMIN = 'admin';

    public const TYPE_TEACHER = 'teacher';

    public const TYPE_STUDENT = 'student';

    public const TYPE_PARENT = 'parent';

    public const STAFF_TYPES = [self::TYPE_ADMIN, self::TYPE_TEACHER];

    /**
     * @param  list<ChatIdentity>  $identities
     */
    public function __construct(
        public readonly string $type,
        public readonly string $name,
        public readonly ?string $email,
        public readonly array $identities,
        public readonly bool $portal = false,
    ) {}

    public function isStaff(): bool
    {
        return in_array($this->type, self::STAFF_TYPES, true);
    }

    public function canCreateGroups(): bool
    {
        return $this->isStaff();
    }

    /** @return list<int> */
    public function ids(): array
    {
        return array_values(array_unique(array_map(
            static fn (ChatIdentity $identity): int => $identity->id,
            $this->identities
        )));
    }

    /** @return list<int> */
    public function centerIds(): array
    {
        return array_values(array_unique(array_map(
            static fn (ChatIdentity $identity): int => $identity->centerId,
            $this->identities
        )));
    }

    public function identityForCenter(int $centerId): ?ChatIdentity
    {
        foreach ($this->identities as $identity) {
            if ($identity->centerId === $centerId) {
                return $identity;
            }
        }

        return $this->identities[0] ?? null;
    }

    public function matches(string $type, int $id): bool
    {
        if ($type !== $this->type) {
            return false;
        }

        return in_array($id, $this->ids(), true);
    }

    public function primary(): ?ChatIdentity
    {
        return $this->identities[0] ?? null;
    }
}
