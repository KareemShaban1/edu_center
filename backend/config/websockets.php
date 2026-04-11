<?php

return [
    'allowed_origins' => [
    'https://edu-center.kareemsoft.org/',
],

'ssl' => [
    'local_cert'  => env('LARAVEL_WEBSOCKETS_SSL_LOCAL_CERT', '/path/to/ssl/fullchain.pem'),
    'local_pk'    => env('LARAVEL_WEBSOCKETS_SSL_LOCAL_PK', '/path/to/ssl/privkey.pem'),
    'passphrase'  => null,
    'verify_peer' => false,
],

];