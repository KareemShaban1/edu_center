<?php

/**
 * One-time codegen: extract closure routes from routes/api.php into controllers + split route files.
 * Run from backend/: php scripts/extract-api-routes.php
 */

declare(strict_types=1);

$baseDir = dirname(__DIR__);
$sourceFile = $baseDir . '/routes/api.php';
$content = file_get_contents($sourceFile);
if ($content === false) {
    fwrite(STDERR, "Cannot read {$sourceFile}\n");
    exit(1);
}

// Strip bootstrap (lines before first Route:: and shared vars) - work inside middleware group body
$lines = explode("\n", $content);
$groupOpenLine = null;
$groupCloseLine = null;
for ($i = 0, $n = count($lines); $i < $n; $i++) {
    if (str_contains($lines[$i], '])->group(function () {')) {
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
    fwrite(STDERR, "Could not locate middleware group boundaries\n");
    exit(1);
}

$bodyLines = array_slice($lines, $groupOpenLine + 1, $groupCloseLine - $groupOpenLine - 1);
$body = implode("\n", $bodyLines);

/** @return list<array{verb:string,path:string,handler:string,raw:string,suffix:string}> */
function parseRoutes(string $body): array
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
        $handlerStart = $m[0][1] + strlen($m[0][0]);
        $rest = substr($body, $handlerStart);

        $suffix = '';
        $handler = '';
        $consumed = 0;

        if (preg_match('/^\[([^\]]+)\]/', $rest, $cm)) {
            $handler = trim($cm[1]);
            $consumed = strlen($cm[0]);
            $after = substr($rest, $consumed);
            if (preg_match('/^(\s*->[^;]+)?;/', $after, $sm)) {
                $suffix = trim($sm[1] ?? '');
                $consumed += strlen($sm[0]);
            }
        } elseif (preg_match('/^fn\s*\([^)]*\)\s*=>\s*/', $rest, $fnm)) {
            $consumed = strlen($fnm[0]);
            $exprStart = $handlerStart + $consumed;
            $expr = extractUntilSemicolon($body, $exprStart);
            $handler = 'fn => ' . trim(rtrim($expr, ';'));
            $consumed += strlen($expr);
        } elseif (preg_match('/^function\s*\(/', $rest)) {
            $closureStart = $handlerStart;
            $closureEnd = findClosureEnd($body, $closureStart);
            $handler = substr($body, $closureStart, $closureEnd - $closureStart);
            $consumed = $closureEnd - $handlerStart;
            $after = substr($body, $handlerStart + $consumed);
            if (preg_match('/^(\s*->[^;]+)?;/', $after, $sm)) {
                $suffix = trim($sm[1] ?? '');
                $consumed += strlen($sm[0]);
            }
        } else {
            $pos = $handlerStart + 1;
            continue;
        }

        $routes[] = [
            'verb' => $verb,
            'path' => $path,
            'handler' => $handler,
            'suffix' => $suffix,
            'raw' => substr($body, $start, $handlerStart + $consumed - $start),
        ];
        $pos = $handlerStart + $consumed;
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

function findClosureEnd(string $body, int $functionPos): int
{
    $open = strpos($body, '{', $functionPos);
    if ($open === false) {
        return $functionPos;
    }
    $depth = 0;
    $len = strlen($body);
    $inString = false;
    $stringChar = '';
    for ($i = $open; $i < $len; $i++) {
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
                // include trailing `);` if present
                $end = $i + 1;
                if (preg_match('/^\s*\)\s*;/', substr($body, $end), $m)) {
                    $end += strlen($m[0]);
                }

                return $end;
            }
        }
    }

    return $len;
}

function routeFileForPath(string $path): string
{
    if (in_array($path, ['/config', '/branding', '/auth/guards', '/public/centers', '/public/stats'], true)
        || str_starts_with($path, '/public/')) {
        return 'public';
    }
    if (in_array($path, ['/login', '/logout', '/user', '/register/parent', '/register/student', '/auth/memberships', '/auth/switch-tenant', '/auth/switch-center'], true)) {
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
    ];

    if (isset($existing[$path])) {
        return $existing[$path];
    }

    $map = [
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

    if (isset($map[$path])) {
        return $map[$path];
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
        'landing-pages' => 'LandingPagesApiController',
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
            $prefixName = match ($prefix) {
                'admin' => 'Admin',
                'teacher' => 'Teacher',
                'student' => 'Student',
                'platform' => 'Platform',
                default => '',
            };
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
        if (preg_match('/^\{(.+)\}$/', $seg, $pm)) {
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

function transformClosureBody(string $closure, string $path): string
{
    // Extract function signature params and body
    if (! preg_match('/function\s*\(([^)]*)\)\s*(?:use\s*\([^)]*\))?\s*\{(.*)\}\s*\)?\s*;?\s*$/s', $closure, $m)) {
        return $closure;
    }
    $params = trim($m[1]);
    $body = $m[2];

    $replacements = [
        '$resolveTenantBySlug' => '$this->resolveTenantBySlug',
        '$resolveTenant' => '$this->resolveCenter',
        '$ensureTenantInitialized' => '$this->ensureTenantInitialized',
        '$centralConnection' => '$this->centralConnection()',
        '$tenantGuards' => 'ApiGuardMaps::TENANT_GUARDS',
        '$guardMap' => 'ApiGuardMaps::GUARD_MAP',
        '$roleMap' => 'ApiGuardMaps::ROLE_MAP',
        '$resolveStudentContext($request)' => '$this->resolveStudentContext($request)',
        '$resolvePlatformContext($request)' => '$this->resolvePlatformContext($request)',
        '$resolveStudentContext' => '$this->resolveStudentContext',
        '$resolvePlatformContext' => '$this->resolvePlatformContext',
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
    if (str_contains($class, '\\Parent\\')) {
        return 'App\\Http\\Support\\ResolvesCenterApiContext';
    }
    if (str_contains($class, '\\Auth\\') || str_contains($class, '\\Public\\') || str_contains($class, '\\ConfigApiController')) {
        return 'App\\Http\\Support\\ResolvesCenterApiContext';
    }

    return 'App\\Http\\Support\\ResolvesCenterApiContext';
}

$routes = parseRoutes($body);
echo 'Parsed ' . count($routes) . " routes\n";

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

$seenRouteKeys = [];

foreach ($routes as $route) {
    $path = $route['path'];
    $verb = $route['verb'];
    $file = routeFileForPath($path);

    // Skip locale-prefixed duplicates (handled in shared.php manually)
    if (str_starts_with($path, '/{locale}/')) {
        continue;
    }

    $routeKey = strtoupper($verb) . ' ' . $path;
    if (isset($seenRouteKeys[$routeKey])) {
        continue;
    }
    $seenRouteKeys[$routeKey] = true;

    $handler = $route['handler'];
    $suffix = $route['suffix'];

    if (str_starts_with($handler, 'App\\') || str_starts_with($handler, 'fn =>')) {
        if (str_starts_with($handler, 'fn =>')) {
            // landing templates stub -> LandingPageApiController
            if ($path === '/admin/landing-pages/templates') {
                $class = 'App\\Http\\Controllers\\Admin\\LandingPageApiController';
                $method = 'templates';
                $routeLine = "Route::{$verb}('{$path}', [{$class}::class, '{$method}'])" . ($suffix ? "->{$suffix}" : '') . ';';
            } else {
                $routeLine = "Route::{$verb}('{$path}', {$handler})" . ($suffix ? "->{$suffix}" : '') . ';';
            }
        } else {
            // [keyed controller
            preg_match('/^([^,]+),\s*[\'"](\w+)[\'"]\s*\]?/', $handler, $hm);
            $routeLine = "Route::{$verb}('{$path}', [{$hm[1]}::class, '{$hm[2]}'])" . ($suffix ? "->{$suffix}" : '') . ';';
        }
    } elseif (str_starts_with($handler, 'function')) {
        $mapped = controllerForPath($path, $verb);
        if (! $mapped) {
            echo "WARN: no controller mapping for {$verb} {$path}\n";
            continue;
        }
        [$class, $method] = $mapped;
        if (! preg_match('/function\s*\(([^)]*)\)/', $handler, $pm)) {
            echo "WARN: bad closure for {$path}\n";
            continue;
        }
        $params = trim($pm[1]);
        $body = transformClosureBody($handler, $path);
        $returnType = ': JsonResponse';
        if (! str_contains($body, 'return response()->json') && ! str_contains($body, 'return app(')) {
            $returnType = '';
        }
        $controllers[$class][$method] = [
            'params' => $params,
            'body' => $body,
            'returnType' => $returnType,
        ];
        $shortClass = $class;
        $routeLine = "Route::{$verb}('{$path}', [{$shortClass}::class, '{$method}'])" . ($suffix ? "->{$suffix}" : '') . ';';
    } else {
        echo "WARN: unknown handler for {$path}: " . substr($handler, 0, 40) . "\n";
        continue;
    }

    $routeFiles[$file][] = $routeLine;
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

    $useLines = array_map(fn ($u) => "use {$u};", $uses);
    sort($useLines);
    $useLines[] = "use {$trait};";
    $useLines[] = 'use App\\Http\\Controllers\\Controller;';
    $useLines = array_values(array_unique($useLines));
    sort($useLines);

    $traitShort = basename(str_replace('\\', '/', $trait));
    $methodCode = '';
    foreach ($methods as $name => $info) {
        $sigParams = $info['params'] !== '' ? $info['params'] : 'Request $request';
        if ($info['params'] !== '' && ! str_contains($info['params'], 'Request')) {
            $sigParams = 'Request $request, ' . $info['params'];
        }
        $methodCode .= "\n    public function {$name}({$sigParams}){$info['returnType']}\n    {\n{$info['body']}\n    }\n";
    }

    $traitUseName = $traitShort;
    $code = "<?php\n\ndeclare(strict_types=1);\n\nnamespace {$namespace};\n\n" . implode("\n", $useLines) . "\n\nclass {$shortName} extends Controller\n{\n    use {$traitUseName};{$methodCode}\n}\n";
    $filePath = $dir . '/' . $shortName . '.php';
    file_put_contents($filePath, $code);
    echo "Wrote controller {$class}\n";
}

// Generate route files
$apiDir = $baseDir . '/routes/api';
if (! is_dir($apiDir)) {
    mkdir($apiDir, 0777, true);
}

$routeHeader = "<?php\n\nuse Illuminate\\Support\\Facades\\Route;\n";

foreach ($routeFiles as $name => $linesOut) {
    if ($linesOut === []) {
        continue;
    }
    $contentOut = $routeHeader . "\n" . implode("\n", $linesOut) . "\n";
    file_put_contents("{$apiDir}/{$name}.php", $contentOut);
    echo "Wrote routes/api/{$name}.php (" . count($linesOut) . " routes)\n";
}

echo "Done.\n";
