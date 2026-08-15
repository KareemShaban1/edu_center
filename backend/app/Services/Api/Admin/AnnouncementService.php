<?php

declare(strict_types=1);

namespace App\Services\Api\Admin;

use App\Http\Support\CenterIdAssigner;
use App\Models\Announcement;
use App\Models\Platform\Center;
use App\Notifications\AnnouncementNotification;
use App\Repositories\AnnouncementRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

use App\Services\MediaService;
use App\Services\NotificationDispatchService;

final class AnnouncementService
{
    public function __construct(
        private readonly AnnouncementRepository $announcementRepository,
        private readonly MediaService $mediaService,
        private readonly NotificationDispatchService $notificationDispatchService,
    ) {}

    /**
     * @return Collection<int, Announcement>
     */
    public function list(): Collection
    {
        return $this->announcementRepository->allWithRelations();
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<UploadedFile>  $uploadedFiles
     */
    public function create(array $payload, array $uploadedFiles, Center $tenant): Announcement
    {
        $collection = (string) config('media.collections.announcements');

        $announcement = DB::connection('center')->transaction(function () use ($payload, $uploadedFiles, $tenant, $collection): Announcement {
            $announcement = new Announcement();
            $this->fillAnnouncement($announcement, $payload);
            CenterIdAssigner::assign($announcement, (int) $tenant->id);
            $announcement->save();

            $this->mediaService->sync($announcement, $collection, $uploadedFiles);

            return $announcement;
        });

        $this->dispatchCreateNotifications($announcement);

        return $this->announcementRepository->find((int) $announcement->id) ?? $announcement->load([
            'grade:id,grade_name',
            'class:id,class_name',
            'section:id,section_name',
            'media',
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<UploadedFile>  $uploadedFiles
     * @param  list<int>  $removeMediaIds
     */
    public function update(
        Announcement $announcement,
        array $payload,
        array $uploadedFiles,
        array $removeMediaIds,
        Center $tenant,
    ): Announcement {
        $collection = (string) config('media.collections.announcements');

        DB::connection('center')->transaction(function () use (
            $announcement,
            $payload,
            $uploadedFiles,
            $removeMediaIds,
            $tenant,
            $collection,
        ): void {
            $this->fillAnnouncement($announcement, $payload);
            CenterIdAssigner::assign($announcement, (int) $tenant->id, onlyIfMissing: true);
            $announcement->save();

            $this->mediaService->sync($announcement, $collection, $uploadedFiles, $removeMediaIds);
        });

        return $this->announcementRepository->find((int) $announcement->id) ?? $announcement->fresh([
            'grade:id,grade_name',
            'class:id,class_name',
            'section:id,section_name',
            'media',
        ]);
    }

    public function delete(Announcement $announcement): void
    {
        $collection = (string) config('media.collections.announcements');

        DB::connection('center')->transaction(function () use ($announcement, $collection): void {
            $this->mediaService->clearCollection($announcement, $collection);
            $announcement->delete();
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function fillAnnouncement(Announcement $announcement, array $payload): void
    {
        $announcement->title = (string) $payload['title'];
        $announcement->body = (string) $payload['content'];
        $announcement->grade_id = (int) $payload['grade_id'];
        $announcement->class_id = (int) $payload['class_id'];
        $announcement->section_id = (int) $payload['section_id'];
        $announcement->announcement_type = (string) $payload['type'];
        $time = $payload['time'] ?? null;
        $announcement->time = is_string($time) && $time !== ''
            ? str_replace('T', ' ', $time)
            : null;
    }

    private function dispatchCreateNotifications(Announcement $announcement): void
    {
        try {
            $notification = new AnnouncementNotification(
                (string) $announcement->title,
                (string) $announcement->body,
                '/student/announcements',
            );

            foreach ($this->notificationDispatchService->resolveRecipients([
                'audience' => 'both',
                'section_id' => (int) $announcement->section_id,
            ]) as $entry) {
                $this->notificationDispatchService->dispatch($entry['model'], $notification, true);
            }
        } catch (\Throwable $e) {
            Log::warning('Announcement notification dispatch failed', [
                'announcement_id' => $announcement->id,
                'message' => $e->getMessage(),
            ]);
        }
    }
}