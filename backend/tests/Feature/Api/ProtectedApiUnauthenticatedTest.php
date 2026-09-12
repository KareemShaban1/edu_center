<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class ProtectedApiUnauthenticatedTest extends TestCase
{
    public function test_every_api_route_rejects_or_serves_without_server_error(): void
    {
        $failures = [];

        foreach ($this->apiRouteInventory() as $route) {
            foreach ($route['methods'] as $method) {
                $uri = $this->fillRouteUri($route['uri']);
                $path = substr($uri, strlen('api'));
                $payload = in_array($method, ['POST', 'PUT', 'PATCH'], true) ? [] : [];

                $response = $this->apiJson($method, $path, $payload);
                $status = $response->status();

                if ($status >= 500) {
                    $failures[] = "{$method} /{$uri} returned {$status}";
                }
            }
        }

        $this->assertSame([], $failures, implode("\n", $failures));
    }
}
