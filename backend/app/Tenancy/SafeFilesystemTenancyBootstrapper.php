<?php

declare(strict_types=1);

namespace App\Tenancy;

use Illuminate\Support\Facades\Storage;
use Stancl\Tenancy\Bootstrappers\FilesystemTenancyBootstrapper;

/**
 * Stancl's revert() assumes bootstrap() ran for every disk. If DatabaseTenancyBootstrapper
 * throws first (missing tenant DB), FilesystemTenancyBootstrapper never stores originals and
 * revert() hits "Undefined array key \"local\"".
 */
class SafeFilesystemTenancyBootstrapper extends FilesystemTenancyBootstrapper
{
    public function revert(): void
    {
        $this->app->useStoragePath($this->originalPaths['storage']);

        $this->app['config']['app.asset_url'] = $this->originalPaths['asset_url'];
        $this->app['url']->setAssetRoot($this->app['config']['app.asset_url']);

        Storage::forgetDisk($this->app['config']['tenancy.filesystem.disks']);

        foreach ($this->app['config']['tenancy.filesystem.disks'] as $disk) {
            if (! array_key_exists($disk, $this->originalPaths['disks'])) {
                continue;
            }
            $this->app['config']["filesystems.disks.{$disk}.root"] = $this->originalPaths['disks'][$disk];
        }
    }
}
