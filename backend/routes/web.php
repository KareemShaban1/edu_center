<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

/*
| SPA is served by Vite (dev) or nginx static `dist/` (production).
| Laravel web routes only provide an optional SPA fallback when index.html exists in public/.
*/

Route::get('/', function () {
    $spa = public_path('index.html');
    if (is_file($spa)) {
        return response()->file($spa);
    }

    return response()->json([
        'message' => 'EduCenter API is running.',
        'hint' => 'Run the React app with npm run dev, or build and deploy dist/ to public/.',
    ]);
});

Route::fallback(function () {
    $spa = public_path('index.html');
    if (is_file($spa)) {
        return response()->file($spa);
    }

    return response()->json(['message' => 'Not found'], 404);
});
