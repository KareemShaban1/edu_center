<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Support\ApiBearerAuth;
use App\Http\Support\ResolvesCenterApiContext;
use App\Models\Platform\Center;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LandingPageApiController extends Controller
{
    use ResolvesCenterApiContext;

    protected function resolveAdminContext(Request $request): array
    {
        $guard = $request->session()->get('api_auth_guard', 'web');
        $bearer = ApiBearerAuth::resolve($request);
        if ($bearer && $bearer['guard'] === 'web') {
            $guard = 'web';
        }

        if ($guard !== 'web') {
            return ['error' => response()->json(['message' => 'Forbidden'], 403)];
        }

        $centerId = $request->session()->get('api_center_id')
            ?? $request->session()->get('api_tenant_id');
        $centerSlug = $request->session()->get('api_center_slug')
            ?? $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Center-Slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('center_slug')
            ?? $request->query('tenant_slug');

        if ($bearer) {
            $centerId = $bearer['tenant_id'] ?: $centerId;
            $centerSlug = $bearer['tenant_slug'] ?: $centerSlug;
        }

        $center = $centerId
            ? Center::query()->find($centerId)
            : $this->resolveCenterBySlug($centerSlug);

        if (! $center) {
            return ['error' => response()->json(['message' => 'Center not found'], 422)];
        }

        $this->ensureCenterInitialized($center);

        $this->ensureWebAdminAuthenticated($request);

        $authUserId = $request->session()->get('api_auth_user_id')
            ?? Auth::guard('web')->id()
            ?? ($bearer ? $bearer['user_id'] : null);

        if ($authUserId && ! Auth::guard('web')->check()) {
            Auth::guard('web')->loginUsingId((int) $authUserId);
        }

        if (! $authUserId) {
            return ['error' => response()->json(['message' => 'Unauthenticated'], 401)];
        }

        if (! Schema::connection('center')->hasTable('landing_pages')) {
            return ['error' => response()->json(['message' => 'Landing pages not migrated. Run tenant migrations.'], 503)];
        }

        return [
            'error' => null,
            'center' => $center,
            'tenant' => $center,
            'centerDb' => DB::connection('center'),
            'tenantDb' => DB::connection('center'),
        ];
    }

    protected function resolvePublicContext(Request $request): array
    {
        $centerSlug = $request->header('X-Center-Slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('center_slug')
            ?? $request->query('tenant_slug');

        if (! $centerSlug) {
            return ['error' => response()->json(['message' => 'Center slug required'], 422)];
        }

        $center = $this->resolveCenterBySlug($centerSlug);
        if (! $center) {
            return ['error' => response()->json(['message' => 'Center not found'], 422)];
        }

        $this->ensureCenterInitialized($center);

        if (! Schema::connection('center')->hasTable('landing_pages')) {
            return ['error' => response()->json(['page' => null])];
        }

        return ['error' => null, 'tenantDb' => DB::connection('center')];
    }

    /** Re-bind admin user after tenant DB switch (session cookie auth). */
    protected function ensureWebAdminAuthenticated(Request $request): void
    {
        if (Auth::guard('web')->check()) {
            return;
        }

        $userId = $request->session()->get('api_auth_user_id');
        if (! $userId) {
            $sessionKey = 'login_web_'.sha1(\App\Models\User::class);
            $userId = $request->session()->get($sessionKey);
        }
        if ($userId) {
            Auth::guard('web')->onceUsingId((int) $userId);
        }
    }

    protected function decodeJson(mixed $value, mixed $default = []): mixed
    {
        if (is_array($value)) {
            return $value;
        }
        if (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);

            return is_array($decoded) ? $decoded : $default;
        }

        return $default;
    }

    protected function storagePathFromUrl(?string $url): ?string
    {
        if (! $url) {
            return null;
        }
        if (preg_match('#/storage/(.+)$#', $url, $matches)) {
            return $matches[1];
        }

        return ltrim(str_replace('\\', '/', $url), '/');
    }

    protected function deleteLandingStorageFile(?string $url): void
    {
        $path = $this->storagePathFromUrl($url);
        if ($path) {
            Storage::disk('landing')->delete($path);
        }
    }

    protected function publicStorageUrl(string $path): string
    {
        return '/storage/'.str_replace('\\', '/', ltrim($path, '/'));
    }

    protected function normalizeStorageUrl(?string $url): ?string
    {
        if (! $url) {
            return $url;
        }
        if (preg_match('#(/storage/[^\s?]+)#', $url, $matches)) {
            return $matches[1];
        }

        return $url;
    }

    protected function defaultTheme(): array
    {
        return [
            'primaryColor' => '#b91c1c',
            'secondaryColor' => '#1e293b',
            'accentColor' => '#f59e0b',
            'backgroundColor' => '#ffffff',
            'textColor' => '#1e293b',
            'headingFont' => 'Cairo, sans-serif',
            'bodyFont' => 'Cairo, sans-serif',
            'headingSize' => 36,
            'bodySize' => 16,
            'borderRadius' => 12,
            'shadowIntensity' => 2,
        ];
    }

    protected function defaultSections(): array
    {
        return [
            [
                'id' => 'sec_hero',
                'type' => 'hero',
                'order' => 0,
                'visible' => true,
                'animation' => 'fade-in',
                'content' => [
                    'badge' => ['en' => 'Expert Teacher', 'ar' => 'معلم خبير'],
                    'headline' => ['en' => 'Transform Your Learning Journey', 'ar' => 'حوّل رحلتك التعليمية'],
                    'subheadline' => ['en' => 'Personalized lessons designed for your success', 'ar' => 'دروس مخصصة مصممة لنجاحك'],
                    'ctaPrimary' => ['en' => 'Book Free Trial', 'ar' => 'احجز تجربة مجانية'],
                    'ctaSecondary' => ['en' => 'Learn More', 'ar' => 'اعرف المزيد'],
                    'imageUrl' => '',
                    'showStats' => true,
                    'stats' => [],
                ],
            ],
            [
                'id' => 'sec_footer',
                'type' => 'footer',
                'order' => 1,
                'visible' => true,
                'animation' => 'fade-in',
                'content' => [
                    'copyright' => ['en' => '© '.date('Y').' Education Center.', 'ar' => '© '.date('Y').' مركز التعليم.'],
                    'links' => [],
                    'social' => ['facebook' => '', 'instagram' => '', 'whatsapp' => ''],
                ],
            ],
        ];
    }

    protected function formatPage(object $row, ?int $visitors = null): array
    {
        return [
            'id' => (string) $row->id,
            'title' => $this->decodeJson($row->title, ['en' => 'Landing Page', 'ar' => 'صفحة هبوط']),
            'slug' => $row->slug,
            'type' => $row->type ?? 'custom',
            'status' => $row->status ?? 'draft',
            'teacherId' => $row->teacher_id ? (int) $row->teacher_id : null,
            'subjectKey' => $row->subject_key,
            'courseId' => $row->course_id ? (int) $row->course_id : null,
            'eventId' => $row->event_id ? (int) $row->event_id : null,
            'branchId' => $row->branch_id ? (int) $row->branch_id : null,
            'sections' => $this->decodeJson($row->sections, $this->defaultSections()),
            'theme' => $this->decodeJson($row->theme, $this->defaultTheme()),
            'seo' => $this->decodeJson($row->seo, [
                'metaTitle' => ['en' => 'Landing Page', 'ar' => 'صفحة هبوط'],
                'metaDescription' => ['en' => '', 'ar' => ''],
                'keywords' => [],
            ]),
            'branding' => $this->decodeJson($row->branding, []),
            'templateId' => $row->template_id,
            'publishedAt' => $row->published_at ? Carbon::parse($row->published_at)->toIso8601String() : null,
            'createdAt' => $row->created_at ? Carbon::parse($row->created_at)->toIso8601String() : now()->toIso8601String(),
            'updatedAt' => $row->updated_at ? Carbon::parse($row->updated_at)->toIso8601String() : now()->toIso8601String(),
            'visitors' => $visitors,
        ];
    }

    protected function formatListItem(object $row, ?int $visitors = null): array
    {
        $title = $this->decodeJson($row->title, ['en' => 'Landing Page', 'ar' => 'صفحة هبوط']);

        return [
            'id' => (string) $row->id,
            'title' => $title,
            'slug' => $row->slug,
            'type' => $row->type ?? 'custom',
            'status' => $row->status ?? 'draft',
            'teacherId' => $row->teacher_id ? (int) $row->teacher_id : null,
            'updatedAt' => $row->updated_at ? Carbon::parse($row->updated_at)->toIso8601String() : now()->toIso8601String(),
            'publishedAt' => $row->published_at ? Carbon::parse($row->published_at)->toIso8601String() : null,
            'visitors' => $visitors ?? 0,
        ];
    }

    protected function storeRevision($tenantDb, int $pageId, array $snapshot, ?string $label = null): void
    {
        if (! Schema::connection('center')->hasTable('landing_page_revisions')) {
            return;
        }
        $tenantDb->table('landing_page_revisions')->insert([
            'landing_page_id' => $pageId,
            'snapshot' => json_encode($snapshot),
            'label' => $label,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $ids = $tenantDb->table('landing_page_revisions')
            ->where('landing_page_id', $pageId)
            ->orderByDesc('id')
            ->pluck('id')
            ->slice(20)
            ->values()
            ->all();
        if (count($ids) > 0) {
            $tenantDb->table('landing_page_revisions')
                ->where('landing_page_id', $pageId)
                ->whereNotIn('id', $ids)
                ->delete();
        }
    }

    protected function pagePayloadFromRequest(Request $request, ?object $existing = null): array
    {
        $data = $request->all();

        return [
            'title' => json_encode($data['title'] ?? $this->decodeJson($existing->title ?? null, ['en' => 'Landing Page', 'ar' => 'صفحة هبوط'])),
            'slug' => $data['slug'] ?? ($existing->slug ?? 'page-'.Str::random(8)),
            'type' => $data['type'] ?? ($existing->type ?? 'custom'),
            'status' => $data['status'] ?? ($existing->status ?? 'draft'),
            'teacher_id' => $data['teacherId'] ?? $data['teacher_id'] ?? ($existing->teacher_id ?? null),
            'subject_key' => $data['subjectKey'] ?? $data['subject_key'] ?? ($existing->subject_key ?? null),
            'course_id' => $data['courseId'] ?? $data['course_id'] ?? ($existing->course_id ?? null),
            'event_id' => $data['eventId'] ?? $data['event_id'] ?? ($existing->event_id ?? null),
            'branch_id' => $data['branchId'] ?? $data['branch_id'] ?? ($existing->branch_id ?? null),
            'sections' => json_encode($data['sections'] ?? $this->decodeJson($existing->sections ?? null, $this->defaultSections())),
            'theme' => json_encode($data['theme'] ?? $this->decodeJson($existing->theme ?? null, $this->defaultTheme())),
            'seo' => json_encode($data['seo'] ?? $this->decodeJson($existing->seo ?? null, [])),
            'branding' => json_encode($data['branding'] ?? $this->decodeJson($existing->branding ?? null, [])),
            'template_id' => $data['templateId'] ?? $data['template_id'] ?? ($existing->template_id ?? null),
            'updated_at' => now(),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $ctx = $this->resolveAdminContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }
        $tenantDb = $ctx['tenantDb'];

        $rows = $tenantDb->table('landing_pages')->orderByDesc('updated_at')->get();
        $analytics = [];
        if (Schema::connection('center')->hasTable('landing_page_analytics')) {
            $analytics = $tenantDb->table('landing_page_analytics')
                ->pluck('visitors', 'landing_page_id')
                ->all();
        }

        $pages = $rows->map(fn ($row) => $this->formatListItem($row, (int) ($analytics[$row->id] ?? 0)))->values();

        return response()->json(['pages' => $pages]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $ctx = $this->resolveAdminContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }
        $row = $ctx['tenantDb']->table('landing_pages')->where('id', $id)->first();
        if (! $row) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        return response()->json(['page' => $this->formatPage($row)]);
    }

    public function store(Request $request): JsonResponse
    {
        $ctx = $this->resolveAdminContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }
        $tenantDb = $ctx['tenantDb'];

        $payload = $this->pagePayloadFromRequest($request);
        $payload['created_at'] = now();
        if (! isset($payload['status'])) {
            $payload['status'] = 'draft';
        }

        $request->validate([
            'slug' => ['nullable', 'string', 'max:255'],
            'title' => ['nullable', 'array'],
        ]);

        $newId = $tenantDb->table('landing_pages')->insertGetId($payload);
        $row = $tenantDb->table('landing_pages')->where('id', $newId)->first();
        $page = $this->formatPage($row);
        $this->storeRevision($tenantDb, $newId, $page, 'Created');

        return response()->json(['page' => $page], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $ctx = $this->resolveAdminContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }
        $tenantDb = $ctx['tenantDb'];

        $existing = $tenantDb->table('landing_pages')->where('id', $id)->first();
        if (! $existing) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        $payload = $this->pagePayloadFromRequest($request, $existing);
        $tenantDb->table('landing_pages')->where('id', $id)->update($payload);
        $row = $tenantDb->table('landing_pages')->where('id', $id)->first();
        $page = $this->formatPage($row);
        $this->storeRevision($tenantDb, $id, $page, $request->input('revisionLabel', 'Auto-save'));

        return response()->json(['page' => $page]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $ctx = $this->resolveAdminContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }
        $tenantDb = $ctx['tenantDb'];

        $deleted = $tenantDb->table('landing_pages')->where('id', $id)->delete();
        if (! $deleted) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        return response()->json(['message' => 'Page deleted']);
    }

    public function publish(Request $request, int $id): JsonResponse
    {
        $ctx = $this->resolveAdminContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }
        $tenantDb = $ctx['tenantDb'];

        $existing = $tenantDb->table('landing_pages')->where('id', $id)->first();
        if (! $existing) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        $tenantDb->table('landing_pages')->where('id', $id)->update([
            'status' => 'published',
            'published_at' => now(),
            'updated_at' => now(),
        ]);
        $row = $tenantDb->table('landing_pages')->where('id', $id)->first();

        return response()->json(['page' => $this->formatPage($row)]);
    }

    public function unpublish(Request $request, int $id): JsonResponse
    {
        $ctx = $this->resolveAdminContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }
        $tenantDb = $ctx['tenantDb'];

        $existing = $tenantDb->table('landing_pages')->where('id', $id)->first();
        if (! $existing) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        $tenantDb->table('landing_pages')->where('id', $id)->update([
            'status' => 'draft',
            'updated_at' => now(),
        ]);
        $row = $tenantDb->table('landing_pages')->where('id', $id)->first();

        return response()->json(['page' => $this->formatPage($row)]);
    }

    public function duplicate(Request $request, int $id): JsonResponse
    {
        $ctx = $this->resolveAdminContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }
        $tenantDb = $ctx['tenantDb'];

        $existing = $tenantDb->table('landing_pages')->where('id', $id)->first();
        if (! $existing) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        $title = $this->decodeJson($existing->title, ['en' => 'Landing Page', 'ar' => 'صفحة هبوط']);
        $title['en'] = ($title['en'] ?? 'Landing Page').' (Copy)';
        $title['ar'] = ($title['ar'] ?? 'صفحة هبوط').' (نسخة)';

        $newId = $tenantDb->table('landing_pages')->insertGetId([
            'title' => json_encode($title),
            'slug' => $existing->slug.'-copy-'.time(),
            'type' => $existing->type,
            'status' => 'draft',
            'teacher_id' => $existing->teacher_id,
            'subject_key' => $existing->subject_key,
            'course_id' => $existing->course_id,
            'event_id' => $existing->event_id,
            'branch_id' => $existing->branch_id,
            'sections' => $existing->sections,
            'theme' => $existing->theme,
            'seo' => $existing->seo,
            'branding' => $existing->branding,
            'template_id' => $existing->template_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $row = $tenantDb->table('landing_pages')->where('id', $newId)->first();

        return response()->json(['page' => $this->formatPage($row)], 201);
    }

    public function fromTeacher(Request $request): JsonResponse
    {
        $ctx = $this->resolveAdminContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }
        $tenantDb = $ctx['tenantDb'];

        $payload = $request->validate([
            'teacherId' => ['required', 'integer'],
            'subjectKey' => ['nullable', 'string', 'max:64'],
        ]);

        $teacher = $tenantDb->table('teachers')->where('id', $payload['teacherId'])->first();
        if (! $teacher) {
            return response()->json(['message' => 'Teacher not found'], 404);
        }

        $subject = $teacher->subject ?? 'Subject';
        $slug = 'teacher/'.Str::slug($teacher->name);
        $title = [
            'en' => $teacher->name.' — '.$subject.' Teacher',
            'ar' => $teacher->name.' — معلم '.$subject,
        ];

        $sections = $this->defaultSections();
        $sections[0]['content']['headline'] = [
            'en' => 'Learn '.$subject.' with '.$teacher->name,
            'ar' => 'تعلّم '.$subject.' مع '.$teacher->name,
        ];
        $sections[0]['content']['subheadline'] = [
            'en' => 'Expert '.$subject.' teacher — personalized lessons',
            'ar' => 'معلم '.$subject.' خبير — دروس مخصصة',
        ];

        $newId = $tenantDb->table('landing_pages')->insertGetId([
            'title' => json_encode($title),
            'slug' => $slug,
            'type' => 'teacher',
            'status' => 'draft',
            'teacher_id' => $teacher->id,
            'subject_key' => $payload['subjectKey'] ?? null,
            'sections' => json_encode($sections),
            'theme' => json_encode($this->defaultTheme()),
            'seo' => json_encode([
                'metaTitle' => $title,
                'metaDescription' => [
                    'en' => 'Book lessons with '.$teacher->name,
                    'ar' => 'احجز دروساً مع '.$teacher->name,
                ],
                'keywords' => [$subject, $teacher->name],
                'schemaType' => 'teacher',
            ]),
            'branding' => json_encode([]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $row = $tenantDb->table('landing_pages')->where('id', $newId)->first();

        return response()->json(['page' => $this->formatPage($row)], 201);
    }

    public function revisions(Request $request, int $pageId): JsonResponse
    {
        $ctx = $this->resolveAdminContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }
        if (! Schema::connection('center')->hasTable('landing_page_revisions')) {
            return response()->json(['revisions' => []]);
        }

        $rows = $ctx['tenantDb']->table('landing_page_revisions')
            ->where('landing_page_id', $pageId)
            ->orderByDesc('id')
            ->limit(20)
            ->get()
            ->map(fn ($row) => [
                'id' => (string) $row->id,
                'pageId' => (string) $pageId,
                'snapshot' => $this->decodeJson($row->snapshot, []),
                'createdAt' => Carbon::parse($row->created_at)->toIso8601String(),
                'label' => $row->label,
            ])
            ->values();

        return response()->json(['revisions' => $rows]);
    }

    public function restoreRevision(Request $request, int $pageId, int $revisionId): JsonResponse
    {
        $ctx = $this->resolveAdminContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }
        $tenantDb = $ctx['tenantDb'];

        $rev = $tenantDb->table('landing_page_revisions')
            ->where('landing_page_id', $pageId)
            ->where('id', $revisionId)
            ->first();
        if (! $rev) {
            return response()->json(['message' => 'Revision not found'], 404);
        }

        $snapshot = $this->decodeJson($rev->snapshot, []);
        $update = $this->pagePayloadFromRequest(new Request($snapshot));
        $tenantDb->table('landing_pages')->where('id', $pageId)->update($update);
        $row = $tenantDb->table('landing_pages')->where('id', $pageId)->first();

        return response()->json(['page' => $this->formatPage($row)]);
    }

    public function analytics(Request $request, int $pageId): JsonResponse
    {
        $ctx = $this->resolveAdminContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }
        $tenantDb = $ctx['tenantDb'];

        if (! Schema::connection('center')->hasTable('landing_page_analytics')) {
            return response()->json(['analytics' => $this->emptyAnalytics($pageId)]);
        }

        $row = $tenantDb->table('landing_page_analytics')->where('landing_page_id', $pageId)->first();
        if (! $row) {
            $tenantDb->table('landing_page_analytics')->insert([
                'landing_page_id' => $pageId,
                'visitors' => 0,
                'unique_visitors' => 0,
                'form_submissions' => 0,
                'cta_clicks' => 0,
                'leads' => 0,
                'device_stats' => json_encode(['mobile' => 0, 'tablet' => 0, 'desktop' => 0]),
                'traffic_sources' => json_encode([]),
                'daily_views' => json_encode([]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $row = $tenantDb->table('landing_page_analytics')->where('landing_page_id', $pageId)->first();
        }

        return response()->json(['analytics' => $this->formatAnalytics($row, $pageId)]);
    }

    protected function emptyAnalytics(int $pageId): array
    {
        return [
            'pageId' => (string) $pageId,
            'visitors' => 0,
            'uniqueVisitors' => 0,
            'conversionRate' => 0,
            'leads' => 0,
            'formSubmissions' => 0,
            'ctaClicks' => 0,
            'deviceStats' => ['mobile' => 0, 'tablet' => 0, 'desktop' => 0],
            'trafficSources' => [],
            'dailyViews' => [],
        ];
    }

    protected function formatAnalytics(object $row, int $pageId): array
    {
        $visitors = (int) $row->visitors;
        $leads = (int) $row->leads;

        return [
            'pageId' => (string) $pageId,
            'visitors' => $visitors,
            'uniqueVisitors' => (int) $row->unique_visitors,
            'conversionRate' => $visitors > 0 ? round(($leads / $visitors) * 100, 1) : 0,
            'leads' => $leads,
            'formSubmissions' => (int) $row->form_submissions,
            'ctaClicks' => (int) $row->cta_clicks,
            'deviceStats' => $this->decodeJson($row->device_stats, ['mobile' => 0, 'tablet' => 0, 'desktop' => 0]),
            'trafficSources' => $this->decodeJson($row->traffic_sources, []),
            'dailyViews' => $this->decodeJson($row->daily_views, []),
        ];
    }

    public function mediaIndex(Request $request): JsonResponse
    {
        $ctx = $this->resolveAdminContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }
        if (! Schema::connection('center')->hasTable('landing_media')) {
            return response()->json(['media' => []]);
        }

        $media = $ctx['tenantDb']->table('landing_media')
            ->orderByDesc('id')
            ->get()
            ->map(fn ($row) => [
                'id' => (string) $row->id,
                'name' => $row->name,
                'type' => $row->type,
                'url' => $this->normalizeStorageUrl($row->url),
                'folder' => $row->folder,
                'size' => $row->size ? (int) $row->size : null,
                'width' => $row->width ? (int) $row->width : null,
                'height' => $row->height ? (int) $row->height : null,
                'createdAt' => Carbon::parse($row->created_at)->toIso8601String(),
            ])
            ->values();

        return response()->json(['media' => $media]);
    }

    public function mediaStore(Request $request): JsonResponse
    {
        $ctx = $this->resolveAdminContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }
        $tenantDb = $ctx['tenantDb'];

        $request->validate([
            'file' => ['required', 'file', 'max:51200'],
            'folder' => ['nullable', 'string', 'max:128'],
        ]);

        $file = $request->file('file');
        $path = $file->store('landing/'.($request->input('folder') ?: 'general'), 'landing');
        $url = $this->publicStorageUrl($path);

        $mime = $file->getMimeType() ?? '';
        $type = str_starts_with($mime, 'video/') ? 'video'
            : ($mime === 'application/pdf' ? 'pdf'
            : (str_contains($mime, 'svg') ? 'svg' : 'image'));

        $id = $tenantDb->table('landing_media')->insertGetId([
            'name' => $file->getClientOriginalName(),
            'type' => $type,
            'url' => $url,
            'folder' => $request->input('folder'),
            'size' => $file->getSize(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['media' => [
            'id' => (string) $id,
            'name' => $file->getClientOriginalName(),
            'type' => $type,
            'url' => $url,
            'folder' => $request->input('folder'),
            'size' => $file->getSize(),
            'createdAt' => now()->toIso8601String(),
        ]], 201);
    }

    public function mediaDestroy(Request $request, int $id): JsonResponse
    {
        $ctx = $this->resolveAdminContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }
        $row = $ctx['tenantDb']->table('landing_media')->where('id', $id)->first();
        if ($row) {
            $this->deleteLandingStorageFile($row->url);
            $ctx['tenantDb']->table('landing_media')->where('id', $id)->delete();
        }

        return response()->json(['message' => 'Media deleted']);
    }

    public function publicShow(Request $request, string $slug): JsonResponse
    {
        $ctx = $this->resolvePublicContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }
        $tenantDb = $ctx['tenantDb'];

        $row = $tenantDb->table('landing_pages')->where('slug', $slug)->first();

        if (! $row) {
            return response()->json(['page' => null, 'reason' => 'not_found']);
        }

        if ($row->status !== 'published') {
            $allowPreview = $request->boolean('preview') && $this->canPreviewDraft($request);
            if (! $allowPreview) {
                return response()->json(['page' => null, 'reason' => 'unpublished']);
            }
        }

        if ($row->status === 'published' && Schema::connection('center')->hasTable('landing_page_analytics')) {
            $analytics = $tenantDb->table('landing_page_analytics')->where('landing_page_id', $row->id)->first();
            if ($analytics) {
                $tenantDb->table('landing_page_analytics')->where('landing_page_id', $row->id)->update([
                    'visitors' => ((int) $analytics->visitors) + 1,
                    'unique_visitors' => ((int) $analytics->unique_visitors) + 1,
                    'updated_at' => now(),
                ]);
            } else {
                $tenantDb->table('landing_page_analytics')->insert([
                    'landing_page_id' => $row->id,
                    'visitors' => 1,
                    'unique_visitors' => 1,
                    'form_submissions' => 0,
                    'cta_clicks' => 0,
                    'leads' => 0,
                    'device_stats' => json_encode(['mobile' => 0, 'tablet' => 0, 'desktop' => 0]),
                    'traffic_sources' => json_encode([]),
                    'daily_views' => json_encode([]),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        return response()->json(['page' => $this->formatPage($row)]);
    }

    protected function canPreviewDraft(Request $request): bool
    {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') {
            return false;
        }

        $authUserId = $request->session()->get('api_auth_user_id');
        if (! $authUserId) {
            $sessionKey = 'login_web_'.sha1(\App\Models\User::class);
            $authUserId = $request->session()->get($sessionKey);
        }

        return (bool) $authUserId;
    }
}
