<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Centers\CenterContextManager;
use App\Models\Platform\Center;
use App\Services\AutoGenerateSessionsService;
use Illuminate\Console\Command;

class AutoGenerateSessionsCommand extends Command
{
    protected $signature = 'sessions:auto-generate
        {--center= : Center id or slug}
        {--days= : Override days ahead}
        {--force : Generate even when auto setting is off}';

    protected $description = 'Generate upcoming sessions from section week days for centers with auto-generation enabled';

    public function handle(CenterContextManager $centers, AutoGenerateSessionsService $generator): int
    {
        $centerOpt = $this->option('center');
        $days = $this->option('days');
        $daysAhead = is_numeric($days) ? (int) $days : null;
        $force = (bool) $this->option('force');

        $query = Center::query()->orderBy('id');
        if ($centerOpt) {
            if (is_numeric($centerOpt)) {
                $query->where('id', (int) $centerOpt);
            } else {
                $query->where('slug', (string) $centerOpt);
            }
        } else {
            $query->where('status', 1);
        }

        $list = $query->get();
        if ($list->isEmpty()) {
            $this->warn('No centers found.');

            return self::SUCCESS;
        }

        $totalCreated = 0;
        foreach ($list as $center) {
            $centers->initialize($center);
            try {
                $result = $generator->generateForCurrentCenter(
                    respectSetting: ! $force,
                    daysAhead: $daysAhead,
                );
                $totalCreated += $result['created'];
                $this->line(sprintf(
                    '[%s] enabled=%s sections=%d created=%d skipped=%d',
                    $center->slug,
                    $result['enabled'] ? 'yes' : 'no',
                    $result['sections'],
                    $result['created'],
                    $result['skipped'],
                ));
            } finally {
                $centers->end();
            }
        }

        $this->info("Done. Created {$totalCreated} session(s).");

        return self::SUCCESS;
    }
}
