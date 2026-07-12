<?php
$content = file_get_contents(dirname(__DIR__) . '/routes/api.php');
$lines = explode("\n", $content);
$open = null; $close = null;
foreach ($lines as $i => $line) {
    if (str_contains($line, '])->group(function () {')) $open = $i;
    if ($open !== null && $i > $open && trim($line) === '});') { $close = $i; break; }
}
$body = implode("\n", array_slice($lines, $open + 1, $close - $open - 1));
echo "open=$open close=$close body_len=" . strlen($body) . PHP_EOL;
echo "route count=" . substr_count($body, 'Route::') . PHP_EOL;
