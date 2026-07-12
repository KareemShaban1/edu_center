<?php
$content = file_get_contents(dirname(__DIR__) . '/routes/api.php.source');
$lines = explode("\n", $content);
$groupOpenLine = null;
$groupCloseLine = null;
for ($i = 0, $n = count($lines); $i < $n; $i++) {
    if (preg_match('/\]\)->group\s*\(\s*function\s*\(\s*\)\s*\{/', $lines[$i])) {
        $groupOpenLine = $i;
    }
}
for ($i = $n - 1; $i >= 0; $i--) {
    if (trim($lines[$i]) === '});') {
        $groupCloseLine = $i;
        break;
    }
}
echo "open=$groupOpenLine close=$groupCloseLine n=$n\n";
if ($groupOpenLine !== null && $groupCloseLine !== null) {
    echo "body lines=" . ($groupCloseLine - $groupOpenLine - 1) . "\n";
}
