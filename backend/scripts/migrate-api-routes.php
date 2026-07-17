<?php

declare(strict_types=1);

/**
 * Complete API closure migration.
 * Run from backend/: php scripts/migrate-api-routes.php
 */

$baseDir = dirname(__DIR__);
$dryRun = in_array('--dry-run', $argv, true);
$sourceArg = null;
foreach (array_slice($argv, 1) as $arg) {
    if ($arg !== '--dry-run' && ! str_starts_with($arg, '-')) {
        $sourceArg = $arg;
        break;
    }
}
$sourceFile = $sourceArg ?? (is_file($baseDir . '/routes/api.php.source') ? $baseDir . '/routes/api.php.source' : $baseDir . '/routes/api.php');
$targetFile = $baseDir . '/routes/api.php';
$content = file_get_contents($sourceFile);
if ($content === false) {
    fwrite(STDERR, "Cannot read routes/api.php\n");
    exit(1);
}

$lines = explode("\n", $content);
$groupOpenLine = null;
$groupCloseLine = null;
for ($i = 0, $n = count($lines); $i < $n; $i++) {
    if ($groupOpenLine === null
        && preg_match('/\]\)->group\s*\(\s*function\s*\(\s*\)\s*\{/', $lines[$i])
        && ! str_contains($lines[$i], 'Route::')) {
        $groupOpenLine = $i;
    }
}
for ($i = $n - 1; $i >= 0; $i--) {
    if (trim($lines[$i]) === '});') {
        $groupCloseLine = $i;
        break;
    }
}
if ($groupOpenLine === null || $groupCloseLine === null) {
    fwrite(STDERR, "Could not locate middleware group\n");
    exit(1);
}

$body = implode("\n", array_slice($lines, $groupOpenLine + 1, $groupCloseLine - $groupOpenLine - 1));

/** @return list<array{verb:string,path:string,handler:string,suffix:string,start:int,end:int}> */
function extractTopLevelRoutes(string $body): array
{
    $routes = [];
    $len = strlen($body);
    $pos = 0;

    while ($pos < $len) {
        if (! preg_match('/\bRoute::(get|post|put|patch|delete)\s*\(\s*[\'"]([^\'"]+)[\'"]\s*,\s*/', $body, $m, PREG_OFFSET_CAPTURE, $pos)) {
            break;
        }

        $verb = $m[1][0];
        $path = $m[2][0];
        $start = $m[0][1];
        $handlerStart = $start + strlen($m[0][0]);
        $rest = substr($body, $handlerStart);
        $suffix = '';
        $handler = '';
        $consumed = 0;

        if (preg_match('/^\[([^\]]+)\]/s', $rest, $cm)) {
            $handler = trim($cm[1]);
            $consumed = strlen($cm[0]);
            if (preg_match('/^(\s*->[^;{]+)?;/', substr($rest, $consumed), $sm)) {
                $suffix = trim($sm[1] ?? '');
                $consumed += strlen($sm[0]);
            }
        } elseif (preg_match('/^fn\s*\([^)]*\)\s*=>\s*/', $rest, $fnm)) {
            $consumed = strlen($fnm[0]);
            $expr = extractUntilSemicolon($body, $handlerStart + $consumed);
            $handler = 'fn => ' . trim(rtrim($expr, ';'));
            $consumed += strlen($expr);
        } elseif (preg_match('/^function\s*\(/', $rest)) {
            $closureEnd = findClosureEnd($body, $handlerStart);
            $handler = substr($body, $handlerStart, $closureEnd - $handlerStart);
            $consumed = $closureEnd - $handlerStart;
            if (preg_match('/^(\s*->[^;{]+)?;/', substr($body, $handlerStart + $consumed), $sm)) {
                $suffix = trim($sm[1] ?? '');
                $consumed += strlen($sm[0]);
            }
        } else {
            $pos = $handlerStart + 1;
            continue;
        }

        $end = $handlerStart + $consumed;
        $routes[] = compact('verb', 'path', 'handler', 'suffix', 'start', 'end');
        $start = $end;

        // Skip nested group bodies (locale aliases) without extracting inner routes
        if (preg_match('/^\s*Route::prefix\s*\(/', substr($body, $end))) {
            $groupStart = strpos($body, 'function () {', $end);
            if ($groupStart !== false) {
                $brace = strpos($body, '{', $groupStart);
                if ($brace !== false) {
                    $groupEnd = findMatchingBrace($body, $brace);
                    $pos = $groupEnd + 1;
                    continue;
                }
            }
        }

        $pos = $end;
    }

    return $routes;
}

function extractUntilSemicolon(string $body, int $start): string
{
    $len = strlen($body);
    $depth = 0;
    $inString = false;
    $stringChar = '';
    for ($i = $start; $i < $len; $i++) {
        $ch = $body[$i];
        if ($inString) {
            if ($ch === '\\') {
                $i++;
                continue;
            }
            if ($ch === $stringChar) {
                $inString = false;
            }
            continue;
        }
        if ($ch === '"' || $ch === "'") {
            $inString = true;
            $stringChar = $ch;
            continue;
        }
        if ($ch === '(' || $ch === '[' || $ch === '{') {
            $depth++;
            continue;
        }
        if ($ch === ')' || $ch === ']' || $ch === '}') {
            $depth--;
            continue;
        }
        if ($ch === ';' && $depth === 0) {
            return substr($body, $start, $i - $start + 1);
        }
    }

    return substr($body, $start);
}

function findMatchingBrace(string $body, int $openPos): int
{
    $depth = 0;
    $len = strlen($body);
    $inString = false;
    $stringChar = '';
    for ($i = $openPos; $i < $len; $i++) {
        $ch = $body[$i];
        if ($inString) {
            if ($ch === '\\') {
                $i++;
                continue;
            }
            if ($ch === $stringChar) {
                $inString = false;
            }
            continue;
        }
        if ($ch === '"' || $ch === "'") {
            $inString = true;
            $stringChar = $ch;
            continue;
        }
        if ($ch === '{') {
            $depth++;
            continue;
        }
        if ($ch === '}') {
            $depth--;
            if ($depth === 0) {
                return $i;
            }
        }
    }

    return $len - 1;
}

function findClosureEnd(string $body, int $functionPos): int
{
    $open = strpos($body, '{', $functionPos);
    if ($open === false) {
        return $functionPos;
    }
    $close = findMatchingBrace($body, $open);
    $end = $close + 1;
    if (preg_match('/^\s*\)\s*;/', substr($body, $end), $m)) {
        $end += strlen($m[0]);
    }

    return $end;
}

function routeFileForPath(string $path): string
{
    if (str_starts_with($path, '/public/')) {
        return 'public';
    }
    if ($path === '/config') {
        return 'shared';
    }
    if (in_array($path, ['/login', '/logout', '/user', '/register/parent', '/register/student', '/auth/memberships', '/auth/switch-tenant', '/auth/switch-center', '/auth/guards'], true)) {
        return 'auth';
    }
    if (str_starts_with($path, '/admin/')) {
        return 'admin';
    }
    if (str_starts_with($path, '/teacher/')) {
        return 'teacher';
    }
    if (str_starts_with($path, '/student/')) {
        return 'student';
    }
    if (str_starts_with($path, '/parent/')) {
        return 'parent';
    }
    if (str_starts_with($path, '/platform/')) {
        return 'platform';
    }

    return 'shared';
}

function controllerForPath(string $path, string $verb): ?array
{
    static $existing = [
        '/branding' => ['App\\Http\\Controllers\\Platform\\PlatformBrandingApiController', 'show'],
        '/platform/centers' => ['App\\Http\\Controllers\\Platform\\PlatformCenterApiController', 'index'],
        '/platform/tenants' => ['App\\Http\\Controllers\\Platform\\PlatformCenterApiController', 'index'],
        '/platform/branding' => ['App\\Http\\Controllers\\Platform\\PlatformBrandingApiController', 'show'],
        '/dashboard' => ['App\\Http\\Controllers\\Admin\\DashboardApiController', 'show'],
        '/config' => ['App\\Http\\Controllers\\Api\\ConfigApiController', 'show'],
        '/auth/guards' => ['App\\Http\\Controllers\\Api\\Auth\\AuthApiController', 'guards'],
        '/public/centers' => ['App\\Http\\Controllers\\Api\\Public\\PublicApiController', 'centers'],
        '/public/stats' => ['App\\Http\\Controllers\\Api\\Public\\PublicApiController', 'stats'],
        '/login' => ['App\\Http\\Controllers\\Api\\Auth\\AuthApiController', 'login'],
        '/logout' => ['App\\Http\\Controllers\\Api\\Auth\\AuthApiController', 'logout'],
        '/user' => ['App\\Http\\Controllers\\Api\\Auth\\AuthApiController', 'user'],
        '/register/parent' => ['App\\Http\\Controllers\\Api\\Auth\\AuthApiController', 'registerParent'],
        '/register/student' => ['App\\Http\\Controllers\\Api\\Auth\\AuthApiController', 'registerStudent'],
        '/auth/memberships' => ['App\\Http\\Controllers\\Api\\Auth\\AuthApiController', 'memberships'],
        '/auth/switch-tenant' => ['App\\Http\\Controllers\\Api\\Auth\\AuthApiController', 'switchCenter'],
        '/auth/switch-center' => ['App\\Http\\Controllers\\Api\\Auth\\AuthApiController', 'switchCenter'],
    ];

    if (isset($existing[$path])) {
        return $existing[$path];
    }

    if (preg_match('#^/admin/bootstrap$#', $path)) {
        return ['App\\Http\\Controllers\\Api\\Admin\\AdminBootstrapApiController', 'show'];
    }
    if (preg_match('#^/teacher/bootstrap$#', $path)) {
        return ['App\\Http\\Controllers\\Api\\Teacher\\TeacherBootstrapApiController', 'show'];
    }
    if (preg_match('#^/parent/portal$#', $path)) {
        return ['App\\Http\\Controllers\\Api\\Parent\\ParentPortalApiController', 'portal'];
    }
    if (preg_match('#^/parent/bootstrap$#', $path)) {
        return ['App\\Http\\Controllers\\Api\\Parent\\ParentBootstrapApiController', 'show'];
    }
    if (preg_match('#^/student/portal$#', $path)) {
        return ['App\\Http\\Controllers\\Api\\Student\\StudentPortalApiController', 'portal'];
    }
    if (preg_match('#^/student/bootstrap$#', $path)) {
        return ['App\\Http\\Controllers\\Api\\Student\\StudentBootstrapApiController', 'show'];
    }

    $domainMap = [
        'sessions' => 'SessionsApiController',
        'students' => 'StudentsApiController',
        'teachers' => 'TeachersApiController',
        'parents' => 'ParentsApiController',
        'grades' => 'GradesApiController',
        'classes' => 'ClassesApiController',
        'sections' => 'SectionsApiController',
        'units' => 'UnitsApiController',
        'lessons' => 'LessonsApiController',
        'homework' => 'HomeworkApiController',
        'fees' => 'FeesApiController',
        'users' => 'UsersApiController',
        'roles' => 'RolesApiController',
        'library' => 'LibraryApiController',
        'announcements' => 'AnnouncementsApiController',
        'reports' => 'ReportsApiController',
        'payments' => 'PaymentsApiController',
        'exams' => 'ExamsApiController',
        'quizzes' => 'QuizzesApiController',
        'attendance' => 'AttendanceApiController',
        'subscriptions' => 'SubscriptionsApiController',
        'activity-logs' => 'ActivityLogsApiController',
    ];

    if (preg_match('#^/(admin|teacher|student|platform)/([^/]+)(?:/(.*))?$#', $path, $m)) {
        $prefix = $m[1];
        $resource = $m[2];
        $suffix = $m[3] ?? '';

        $namespace = match ($prefix) {
            'admin' => 'App\\Http\\Controllers\\Api\\Admin\\',
            'teacher' => 'App\\Http\\Controllers\\Api\\Teacher\\',
            'student' => 'App\\Http\\Controllers\\Api\\Student\\',
            'platform' => 'App\\Http\\Controllers\\Api\\Platform\\',
            default => null,
        };

        if ($namespace && isset($domainMap[$resource])) {
            $baseName = str_replace('ApiController', '', $domainMap[$resource]);
            $prefixName = ucfirst($prefix);
            $class = $namespace . $prefixName . $baseName . 'ApiController';
            $method = methodNameFromRoute($verb, $resource, $suffix);

            return [$class, $method];
        }
    }

    return null;
}

function methodNameFromRoute(string $verb, string $resource, string $suffix): string
{
    if ($suffix === '') {
        return match ($verb) {
            'get' => $resource === 'bootstrap' ? 'show' : 'index',
            'post' => 'store',
            'put' => 'update',
            'patch' => 'patch',
            'delete' => 'destroy',
            default => $verb,
        };
    }

    $parts = [];
    foreach (explode('/', $suffix) as $seg) {
        if (preg_match('/^\{(.+)\}$/', $seg)) {
            continue;
        }
        foreach (explode('-', $seg) as $piece) {
            $parts[] = ucfirst($piece);
        }
    }

    $name = lcfirst(implode('', $parts));
    if ($name === '') {
        return match ($verb) {
            'get' => 'show',
            'post' => 'store',
            'put' => 'update',
            'patch' => 'patch',
            'delete' => 'destroy',
            default => $verb,
        };
    }

    if ($verb === 'get') {
        return $name;
    }
    if ($verb === 'post' && ! str_contains($suffix, '{')) {
        return $name;
    }
    if ($verb === 'put') {
        return 'update' . ucfirst($name);
    }
    if ($verb === 'delete') {
        return 'destroy' . ucfirst($name);
    }

    return $verb . ucfirst($name);
}

function transformClosureBody(string $closure): string
{
    if (! preg_match('/function\s*\(([^)]*)\)\s*(?:use\s*\([^)]*\))?\s*\{(.*)\}\s*\)?\s*;?\s*$/s', $closure, $m)) {
        return $closure;
    }
    $body = $m[2];
    $replacements = [
        '$resolveStudentContext($request)' => '$this->resolveStudentContext($request)',
        '$resolvePlatformContext($request)' => '$this->resolvePlatformContext($request)',
        '$resolveTenantBySlug' => '$this->resolveTenantBySlug',
        '$resolveTenant' => '$this->resolveCenter',
        '$ensureTenantInitialized' => '$this->ensureTenantInitialized',
        '$centralConnection' => '$this->centralConnection()',
        '$tenantGuards' => 'ApiGuardMaps::TENANT_GUARDS',
        '$guardMap' => 'ApiGuardMaps::GUARD_MAP',
        '$roleMap' => 'ApiGuardMaps::ROLE_MAP',
    ];
    foreach ($replacements as $from => $to) {
        $body = str_replace($from, $to, $body);
    }

    return trim($body);
}

function usesFromBody(string $body): array
{
    $uses = [
        'Illuminate\\Http\\Request',
        'Illuminate\\Http\\JsonResponse',
        'Illuminate\\Support\\Facades\\Auth',
        'Illuminate\\Support\\Facades\\DB',
        'Illuminate\\Support\\Facades\\Schema',
        'Illuminate\\Support\\Facades\\Hash',
        'Illuminate\\Support\\Facades\\Config',
        'Illuminate\\Support\\Str',
    ];
    $symbols = [
        'SectionWeekDays' => 'App\\Http\\Support\\SectionWeekDays',
        'ApiBearerAuth' => 'App\\Http\\Support\\ApiBearerAuth',
        'ApiGuardMaps' => 'App\\Http\\Support\\ApiGuardMaps',
        'AuthLoginHandler' => 'App\\Http\\Support\\AuthLoginHandler',
        'AuthRegisterHandler' => 'App\\Http\\Support\\AuthRegisterHandler',
        'MultiCenterPortalService' => 'App\\Http\\Support\\MultiCenterPortalService',
        'AdminUploadHelper' => 'App\\Http\\Support\\AdminUploadHelper',
        'SessionTypeHelper' => 'App\\Http\\Support\\SessionTypeHelper',
        'MediaUrlHelper' => 'App\\Http\\Support\\MediaUrlHelper',
        'StudentWhatsAppContactResolver' => 'App\\Services\\StudentWhatsAppContactResolver',
        'NotificationDispatchService' => 'App\\Services\\NotificationDispatchService',
        'Center::' => 'App\\Models\\Platform\\Center',
        'CenterMembership::' => 'App\\Models\\Platform\\CenterMembership',
        'CenterMembershipService' => 'App\\Centers\\CenterMembershipService',
        'Student::' => 'App\\Models\\Student',
        'Parents::' => 'App\\Models\\Parents',
        'Library::' => 'App\\Models\\Library',
        'Announcement::' => 'App\\Models\\Announcement',
        'Unit::' => 'App\\Models\\Unit',
        'Lesson::' => 'App\\Models\\Lesson',
        'StudentHomework::' => 'App\\Models\\StudentHomework',
        'Media::' => 'Spatie\\MediaLibrary\\MediaCollections\\Models\\Media',
        'AnnouncementNotification' => 'App\\Notifications\\AnnouncementNotification',
        'ParentAttendanceNotification' => 'App\\Notifications\\ParentAttendanceNotification',
        'StudentAttendanceNotification' => 'App\\Notifications\\StudentAttendanceNotification',
        'QueryException' => 'Illuminate\\Database\\QueryException',
        'Attendance::' => 'App\\Models\\Attendance',
    ];
    foreach ($symbols as $needle => $fqcn) {
        if (str_contains($body, $needle)) {
            $uses[] = $fqcn;
        }
    }

    return array_values(array_unique($uses));
}

function traitForController(string $class): string
{
    if (str_contains($class, '\\Admin\\')) {
        return 'App\\Http\\Support\\ResolvesAdminApiContext';
    }
    if (str_contains($class, '\\Teacher\\')) {
        return 'App\\Http\\Support\\ResolvesTeacherApiContext';
    }
    if (str_contains($class, '\\Student\\')) {
        return 'App\\Http\\Support\\ResolvesStudentApiContext';
    }
    if (str_contains($class, '\\Platform\\')) {
        return 'App\\Http\\Support\\ResolvesPlatformApiContext';
    }

    return 'App\\Http\\Support\\ResolvesCenterApiContext';
}

function controllerRouteLine(string $class, string $method, string $verb, string $path, string $suffix): string
{
    $suffixPart = $suffix !== '' ? "->{$suffix}" : '';

    return "Route::{$verb}('{$path}', [{$class}::class, '{$method}']){$suffixPart};";
}

function extractLocaleGroupBlock(string $body): string
{
    if (! preg_match('/Route::prefix\(\s*[\'"]\{locale\}[\'"]\s*\).*?->group\s*\(\s*function\s*\(\s*\)\s*\{/', $body, $m, PREG_OFFSET_CAPTURE)) {
        return '';
    }
    $functionBrace = strpos($body, '{', (int) $m[0][1] + strlen($m[0][0]) - 1);
    if ($functionBrace === false) {
        return '';
    }
    $groupEnd = findMatchingBrace($body, $functionBrace);

    return substr($body, (int) $m[0][1], $groupEnd - (int) $m[0][1] + 1);
}

$dryRun = in_array('--dry-run', $argv, true);
$localeBlock = extractLocaleGroupBlock($body);
if ($localeBlock !== '') {
    $body = str_replace($localeBlock, '', $body);
}
$routes = extractTopLevelRoutes($body);
echo 'Extracted ' . count($routes) . " top-level routes from {$sourceFile}\n";
if ($dryRun) {
    foreach ($routes as $r) {
        echo "  {$r['verb']} {$r['path']}\n";
    }
    exit(0);
}

// $localeBlock captured before body strip

/** @var array<string, array<string, array{params:string,body:string,returnType:string}>> */
$controllers = [];
/** @var array<string, list<string>> */
$routeFiles = [
    'public' => [],
    'auth' => [],
    'admin' => [],
    'teacher' => [],
    'student' => [],
    'parent' => [],
    'platform' => [],
    'shared' => [],
];

$sharedStaticRoutes = [];
$seenRouteKeys = [];

foreach ($routes as $route) {
    $path = $route['path'];
    $verb = $route['verb'];
    $file = routeFileForPath($path);
    $routeKey = strtoupper($verb) . ' ' . $path;
    if (isset($seenRouteKeys[$routeKey])) {
        continue;
    }
    $seenRouteKeys[$routeKey] = true;

    $handler = $route['handler'];
    $suffix = $route['suffix'];

    if (str_starts_with($handler, 'function')) {
        $mapped = controllerForPath($path, $verb);
        if (! $mapped) {
            echo "WARN: no controller for {$verb} {$path}\n";
            continue;
        }
        [$class, $method] = $mapped;
        if (! preg_match('/function\s*\(([^)]*)\)/', $handler, $pm)) {
            echo "WARN: bad closure {$path}\n";
            continue;
        }
        $params = trim($pm[1]);
        $bodyTransformed = transformClosureBody($handler);
        $returnType = (str_contains($bodyTransformed, 'return response()->json') || str_contains($bodyTransformed, 'return app('))
            ? ': JsonResponse' : '';
        $controllers[$class][$method] = [
            'params' => $params,
            'body' => $bodyTransformed,
            'returnType' => $returnType,
        ];
        $routeFiles[$file][] = controllerRouteLine($class, $method, $verb, $path, $suffix);
        continue;
    }

    if (str_starts_with($handler, 'fn =>')) {
        if ($path === '/admin/landing-pages/templates') {
            $routeFiles['admin'][] = controllerRouteLine('App\\Http\\Controllers\\Admin\\LandingPageApiController', 'templates', $verb, $path, $suffix);
        } else {
            $sharedStaticRoutes[] = "Route::{$verb}('{$path}', {$handler})" . ($suffix ? "->{$suffix}" : '') . ';';
        }
        continue;
    }

    // Existing controller mapping -> shared
    if (preg_match('/^([^,]+)::class,\s*[\'"](\w+)[\'"]/', $handler, $hm)) {
        $sharedStaticRoutes[] = controllerRouteLine($hm[1], $hm[2], $verb, $path, $suffix);
        continue;
    }

    echo "WARN: unhandled {$verb} {$path}\n";
}

// Generate controllers
foreach ($controllers as $class => $methods) {
    $parts = explode('\\', $class);
    $shortName = array_pop($parts);
    $namespace = implode('\\', $parts);
    $dir = $baseDir . '/app/Http/Controllers/' . implode('/', array_slice($parts, 3));
    if (! is_dir($dir)) {
        mkdir($dir, 0777, true);
    }

    $sampleBody = implode("\n", array_column($methods, 'body'));
    $uses = usesFromBody($sampleBody);
    $trait = traitForController($class);
    $traitShort = basename(str_replace('\\', '/', $trait));

    $useLines = array_map(fn ($u) => "use {$u};", $uses);
    $useLines[] = "use {$trait};";
    $useLines[] = 'use App\\Http\\Controllers\\Controller;';
    $useLines = array_values(array_unique($useLines));
    sort($useLines);

    $methodCode = '';
    foreach ($methods as $name => $info) {
        $sigParams = $info['params'] !== '' ? $info['params'] : 'Request $request';
        if ($info['params'] !== '' && ! str_contains($info['params'], 'Request')) {
            $sigParams = 'Request $request, ' . $info['params'];
        } elseif ($info['params'] === '') {
            $sigParams = 'Request $request';
        }
        $methodCode .= "\n    public function {$name}({$sigParams}){$info['returnType']}\n    {\n{$info['body']}\n    }\n";
    }

    $code = "<?php\n\ndeclare(strict_types=1);\n\nnamespace {$namespace};\n\n" . implode("\n", $useLines) . "\n\nclass {$shortName} extends Controller\n{\n    use {$traitShort};{$methodCode}\n}\n";
    file_put_contents($dir . '/' . $shortName . '.php', $code);
    echo "Wrote {$class}\n";
}

$apiDir = $baseDir . '/routes/api';
if (! is_dir($apiDir)) {
    mkdir($apiDir, 0777, true);
}

$routeHeader = "<?php\n\nuse Illuminate\\Support\\Facades\\Route;\n\n";
foreach ($routeFiles as $name => $linesOut) {
    if ($linesOut === []) {
        continue;
    }
    file_put_contents("{$apiDir}/{$name}.php", $routeHeader . implode("\n", $linesOut) . "\n");
    echo "Wrote routes/api/{$name}.php (" . count($linesOut) . " routes)\n";
}

// Preserve auth/public from existing requires
$authFile = $baseDir . '/routes/api/auth.php';
$publicFile = $baseDir . '/routes/api/public.php';

$slimApi = <<<'PHP'
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Platform\PlatformCenterApiController;
use App\Http\Controllers\Platform\PlatformBrandingApiController;
use App\Http\Controllers\Admin\DashboardApiController;
use App\Http\Controllers\Admin\LandingPageApiController;
use App\Http\Controllers\Api\ConfigApiController;
use App\Http\Controllers\Api\NotificationApiController;
use App\Http\Controllers\Api\CertificationApiController;
use App\Http\Controllers\Api\WhatsAppApiController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::middleware([
    \App\Http\Middleware\EncryptCookies::class,
    \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
    \Illuminate\Session\Middleware\StartSession::class,
    \App\Http\Middleware\SyncLegacyCenterSession::class,
    \App\Http\Middleware\RestoreApiSessionFromBearer::class,
])->group(function () {
    Route::get('/config', [ConfigApiController::class, 'show']);
    Route::get('/branding', [PlatformBrandingApiController::class, 'show']);

    require __DIR__ . '/api/admin.php';
    require __DIR__ . '/api/teacher.php';
    require __DIR__ . '/api/student.php';
    require __DIR__ . '/api/parent.php';

PHP;

foreach ($sharedStaticRoutes as $line) {
    if (str_contains($line, '/platform/')) {
        $slimApi .= "    {$line}\n";
    }
}

$slimApi .= <<<'PHP'

    require __DIR__ . '/api/platform.php';

    Route::get('/dashboard', [DashboardApiController::class, 'show']);

    Route::get('/notifications/vapid-key', [NotificationApiController::class, 'vapidKey']);
    Route::get('/notifications', [NotificationApiController::class, 'index']);
    Route::post('/notifications/subscribe', [NotificationApiController::class, 'subscribe']);
    Route::post('/notifications/mark-all-read', [NotificationApiController::class, 'markAllRead']);
    Route::post('/notifications/{id}/read', [NotificationApiController::class, 'markRead'])->whereUuid('id');
    Route::get('/admin/notifications', [NotificationApiController::class, 'adminIndex']);
    Route::post('/admin/notifications/send', [NotificationApiController::class, 'adminSend']);

    Route::get('/admin/whatsapp/templates', [WhatsAppApiController::class, 'listTemplates']);
    Route::post('/admin/whatsapp/templates', [WhatsAppApiController::class, 'createTemplate']);
    Route::put('/admin/whatsapp/templates/{id}', [WhatsAppApiController::class, 'updateTemplate'])->whereNumber('id');
    Route::delete('/admin/whatsapp/templates/{id}', [WhatsAppApiController::class, 'deleteTemplate'])->whereNumber('id');
    Route::post('/admin/whatsapp/prepare', [WhatsAppApiController::class, 'prepareSend']);
    Route::post('/admin/whatsapp/send', [WhatsAppApiController::class, 'send']);
    Route::get('/admin/whatsapp/status', [WhatsAppApiController::class, 'status']);

    Route::get('/admin/certifications/templates', [CertificationApiController::class, 'listTemplates']);
    Route::post('/admin/certifications/templates', [CertificationApiController::class, 'createTemplate']);
    Route::put('/admin/certifications/templates/{id}', [CertificationApiController::class, 'updateTemplate'])->whereNumber('id');
    Route::delete('/admin/certifications/templates/{id}', [CertificationApiController::class, 'deleteTemplate'])->whereNumber('id');
    Route::get('/admin/certifications/issued', [CertificationApiController::class, 'listIssued']);
    Route::post('/admin/certifications/prepare', [CertificationApiController::class, 'prepareIssue']);
    Route::post('/admin/certifications/issue', [CertificationApiController::class, 'issue']);
    Route::delete('/admin/certifications/issued/{id}', [CertificationApiController::class, 'deleteIssued'])->whereNumber('id');

PHP;

if ($localeBlock !== '') {
    $slimApi .= "    {$localeBlock}\n\n";
}

$slimApi .= <<<'PHP'
    require __DIR__ . '/api/public.php';
    require __DIR__ . '/api/auth.php';

    Route::get('/admin/landing-pages', [LandingPageApiController::class, 'index']);
    Route::post('/admin/landing-pages', [LandingPageApiController::class, 'store']);
    Route::post('/admin/landing-pages/from-template', [LandingPageApiController::class, 'store']);
    Route::post('/admin/landing-pages/from-teacher', [LandingPageApiController::class, 'fromTeacher']);
    Route::get('/admin/landing-pages/media', [LandingPageApiController::class, 'mediaIndex']);
    Route::post('/admin/landing-pages/media', [LandingPageApiController::class, 'mediaStore']);
    Route::delete('/admin/landing-pages/media/{id}', [LandingPageApiController::class, 'mediaDestroy']);
    Route::get('/admin/landing-pages/{id}', [LandingPageApiController::class, 'show'])->whereNumber('id');
    Route::put('/admin/landing-pages/{id}', [LandingPageApiController::class, 'update'])->whereNumber('id');
    Route::delete('/admin/landing-pages/{id}', [LandingPageApiController::class, 'destroy'])->whereNumber('id');
    Route::post('/admin/landing-pages/{id}/publish', [LandingPageApiController::class, 'publish'])->whereNumber('id');
    Route::post('/admin/landing-pages/{id}/unpublish', [LandingPageApiController::class, 'unpublish'])->whereNumber('id');
    Route::post('/admin/landing-pages/{id}/duplicate', [LandingPageApiController::class, 'duplicate'])->whereNumber('id');
    Route::get('/admin/landing-pages/{pageId}/revisions', [LandingPageApiController::class, 'revisions'])->whereNumber('pageId');
    Route::post('/admin/landing-pages/{pageId}/revisions/{revisionId}/restore', [LandingPageApiController::class, 'restoreRevision'])->whereNumber(['pageId', 'revisionId']);
    Route::get('/admin/landing-pages/{pageId}/analytics', [LandingPageApiController::class, 'analytics'])->whereNumber('pageId');
    Route::get('/public/landing/{slug}', [LandingPageApiController::class, 'publicShow'])->where('slug', '.+');
});
PHP;

file_put_contents($targetFile, $slimApi);
echo "Rewrote {$targetFile}\n";
echo "Done.\n";
