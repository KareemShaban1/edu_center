<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Testing\TestResponse;
use Illuminate\Support\Facades\Route;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function apiUrl(string $path): string
    {
        return 'http://127.0.0.1/api/'.ltrim($path, '/');
    }

    /**
     * @param  array<string, string>  $headers
     * @param  array<string, mixed>  $data
     */
    protected function apiJson(string $method, string $path, array $data = [], array $headers = []): TestResponse
    {
        return $this
            ->withServerVariables([
                'HTTP_HOST' => '127.0.0.1',
                'SERVER_NAME' => '127.0.0.1',
            ])
            ->withHeaders(array_merge([
                'Accept' => 'application/json',
                'X-Requested-With' => 'XMLHttpRequest',
            ], $headers))
            ->json($method, $this->apiUrl($path), $data);
    }

    /**
     * @return list<array{methods: list<string>, uri: string}>
     */
    protected function apiRouteInventory(): array
    {
        $inventory = [];

        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();
            if (! str_starts_with($uri, 'api/')) {
                continue;
            }

            $methods = array_values(array_filter(
                $route->methods(),
                static fn (string $method): bool => in_array($method, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], true)
            ));

            if ($methods === []) {
                continue;
            }

            $inventory[] = [
                'methods' => $methods,
                'uri' => $uri,
            ];
        }

        return $inventory;
    }

    protected function fillRouteUri(string $uri): string
    {
        return (string) preg_replace_callback('/\{([^}]+)\}/', static function (array $matches): string {
            $name = explode(':', $matches[1])[0];
            return match ($name) {
                'date' => '2026-01-01',
                'slug', 'fileName' => 'demo',
                'format' => 'pdf',
                'source' => 'exam',
                'type' => 'attendance',
                'locale' => 'en',
                'key' => 'test.key',
                default => '1',
            };
        }, $uri);
    }
}
