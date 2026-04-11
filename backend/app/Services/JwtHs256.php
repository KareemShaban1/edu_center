<?php

namespace App\Services;

final class JwtHs256
{
    public static function encode(array $payload, string $secret): string
    {
        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        $segments = [
            self::b64((string) json_encode($header)),
            self::b64((string) json_encode($payload)),
        ];
        $signing = implode('.', $segments);
        $sig = self::b64(hash_hmac('sha256', $signing, $secret, true));

        return $signing.'.'.$sig;
    }

    private static function b64(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
