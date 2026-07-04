<?php

declare(strict_types=1);

namespace App\Http\Support;

use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

final class AdminUploadHelper
{
    /**
     * @return list<UploadedFile>
     */
    public static function validatedFiles(Request $request, string $key = 'files', int $maxKb = 51200): array
    {
        if (! $request->hasFile($key)) {
            return [];
        }

        $files = $request->file($key);
        if ($files === null) {
            return [];
        }

        if (! is_array($files)) {
            $files = [$files];
        }

        $valid = [];

        foreach ($files as $index => $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }

            if (! $file->isValid()) {
                throw ValidationException::withMessages([
                    "{$key}.{$index}" => [
                        self::uploadErrorMessage($file),
                    ],
                ]);
            }

            if ($file->getSize() > ($maxKb * 1024)) {
                throw ValidationException::withMessages([
                    "{$key}.{$index}" => [
                        "The file may not be greater than {$maxKb} kilobytes.",
                    ],
                ]);
            }

            $valid[] = $file;
        }

        return $valid;
    }

    private static function uploadErrorMessage(UploadedFile $file): string
    {
        $message = $file->getErrorMessage();
        if ($message !== '') {
            return $message;
        }

        return 'The file failed to upload.';
    }
}
