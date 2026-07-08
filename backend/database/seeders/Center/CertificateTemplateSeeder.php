<?php

declare(strict_types=1);

namespace Database\Seeders\Center;

use App\Models\CertificationTemplate;
use Illuminate\Database\Seeder;

class CertificateTemplateSeeder extends Seeder
{
    /**
     * @return list<array{title: string, design_id: string, content: string, variables: list<string>, fields: array<string, string>}>
     */
    private function templates(): array
    {
        return [
            [
                'title' => 'Certificate of Completion',
                'design_id' => 'classic-gold',
                'content' => "CERTIFICATE OF COMPLETION\n\nThis is to certify that\n\n{{student_name}}\n\nhas successfully completed the course requirements for\n\n{{section_name}}\n\nDate: {{date}}",
                'variables' => ['student_name', 'section_name', 'date', 'center_name'],
                'fields' => [
                    'heading' => 'CERTIFICATE OF COMPLETION',
                    'subtitle' => 'This is to certify that',
                    'body' => '{{student_name}} has successfully completed all requirements for {{section_name}}.',
                    'footer' => 'Date: {{date}} · {{center_name}}',
                ],
            ],
            [
                'title' => 'Certificate of Excellence',
                'design_id' => 'ornate-royal',
                'content' => "CERTIFICATE OF EXCELLENCE\n\nAwarded to\n\n{{student_name}}\n\nfor outstanding academic performance in {{section_name}}\n\nScore: {{degree}}\nDate: {{date}}",
                'variables' => ['student_name', 'section_name', 'degree', 'date', 'center_name'],
                'fields' => [
                    'heading' => 'CERTIFICATE OF EXCELLENCE',
                    'subtitle' => 'It is our honor to present this certificate to',
                    'body' => '{{student_name}} for exceptional academic achievement. Score: {{degree}}',
                    'footer' => '{{section_name}} · {{date}}',
                ],
            ],
            [
                'title' => 'Certificate of Achievement',
                'design_id' => 'classic-navy',
                'content' => "CERTIFICATE OF ACHIEVEMENT\n\nPresented to\n\n{{student_name}}\n\nIn recognition of remarkable progress in {{section_name}}\n\nDate: {{date}}",
                'variables' => ['student_name', 'section_name', 'date', 'center_name'],
                'fields' => [
                    'heading' => 'CERTIFICATE OF ACHIEVEMENT',
                    'subtitle' => 'Presented to',
                    'body' => '{{student_name}} for outstanding dedication and performance in {{section_name}}.',
                    'footer' => '{{date}}',
                ],
            ],
            [
                'title' => 'Certificate of Participation',
                'design_id' => 'participation-green',
                'content' => "CERTIFICATE OF PARTICIPATION\n\nThis certifies that\n\n{{student_name}}\n\nhas actively participated in {{section_name}}\n\nDate: {{date}}",
                'variables' => ['student_name', 'section_name', 'date', 'center_name', 'status'],
                'fields' => [
                    'heading' => 'CERTIFICATE OF PARTICIPATION',
                    'subtitle' => 'This is to acknowledge that',
                    'body' => '{{student_name}} has demonstrated consistent participation in {{section_name}}.',
                    'footer' => 'Status: {{status}} · {{date}}',
                ],
            ],
            [
                'title' => 'Honor Roll Certificate',
                'design_id' => 'honor-black-gold',
                'content' => "HONOR ROLL CERTIFICATE\n\n{{student_name}}\n\nhas earned a place on the Honor Roll for {{section_name}}\n\nScore: {{degree}}\nDate: {{date}}",
                'variables' => ['student_name', 'section_name', 'degree', 'date', 'center_name'],
                'fields' => [
                    'heading' => 'HONOR ROLL CERTIFICATE',
                    'subtitle' => 'With highest distinction awarded to',
                    'body' => '{{student_name}} · Score: {{degree}}',
                    'footer' => '{{section_name}} · {{date}}',
                ],
            ],
            [
                'title' => 'Modern Excellence Award',
                'design_id' => 'modern-teal',
                'content' => "CERTIFICATE\n\nAwarded to {{student_name}} for excellence in {{section_name}}.\n\n{{date}}",
                'variables' => ['student_name', 'section_name', 'date', 'center_name'],
                'fields' => [
                    'heading' => 'CERTIFICATE',
                    'subtitle' => 'Awarded to',
                    'body' => '{{student_name}} for excellence in {{section_name}}.',
                    'footer' => '{{date}}',
                ],
            ],
            [
                'title' => 'Academic Merit',
                'design_id' => 'academic-scroll',
                'content' => "ACADEMIC CERTIFICATE\n\n{{student_name}} has fulfilled all requirements for {{section_name}}.\n\nIssued on {{date}}",
                'variables' => ['student_name', 'section_name', 'date', 'center_name'],
                'fields' => [
                    'heading' => 'ACADEMIC CERTIFICATE',
                    'subtitle' => 'The administration certifies that',
                    'body' => '{{student_name}} has fulfilled all academic requirements for {{section_name}}.',
                    'footer' => 'Issued on {{date}}',
                ],
            ],
            [
                'title' => 'Professional Certificate',
                'design_id' => 'professional-blue',
                'content' => "PROFESSIONAL CERTIFICATE\n\n{{student_name}} has met all standards for {{section_name}}.\n\n{{center_name}} · {{date}}",
                'variables' => ['student_name', 'section_name', 'date', 'center_name'],
                'fields' => [
                    'heading' => 'PROFESSIONAL CERTIFICATE',
                    'subtitle' => 'This document certifies that',
                    'body' => '{{student_name}} has met all professional standards for {{section_name}}.',
                    'footer' => 'Authorized by {{center_name}} · {{date}}',
                ],
            ],
            [
                'title' => 'شهادة إتمام الدورة',
                'design_id' => 'arabic-gold',
                'content' => "شهادة إتمام\n\n{{student_name}}\n\nقد أتم/ت متطلبات {{section_name}}\n\nالتاريخ: {{date}}",
                'variables' => ['student_name', 'section_name', 'date', 'center_name'],
                'fields' => [
                    'heading' => 'شهادة إتمام',
                    'subtitle' => 'تشهد بأن الطالب/ة',
                    'body' => '{{student_name}} قد أتم/ت متطلبات {{section_name}} بنجاح.',
                    'footer' => 'التاريخ: {{date}} · {{center_name}}',
                ],
            ],
            [
                'title' => 'شهادة تميز',
                'design_id' => 'arabic-emerald',
                'content' => "شهادة تميز\n\n{{student_name}}\n\nلتفوقه/ا في {{section_name}}\n\nالدرجة: {{degree}}",
                'variables' => ['student_name', 'section_name', 'degree', 'date', 'center_name'],
                'fields' => [
                    'heading' => 'شهادة تميز',
                    'subtitle' => 'تُمنح إلى',
                    'body' => '{{student_name}} لتفوقه/ا الأكاديمي في {{section_name}}. الدرجة: {{degree}}',
                    'footer' => 'التاريخ: {{date}}',
                ],
            ],
            [
                'title' => 'Super Star Certificate',
                'design_id' => 'kids-colorful',
                'content' => "SUPER STAR CERTIFICATE\n\n{{student_name}} for being awesome in {{section_name}}!",
                'variables' => ['student_name', 'section_name', 'date'],
                'fields' => [
                    'heading' => 'SUPER STAR CERTIFICATE',
                    'subtitle' => 'Yay! This goes to',
                    'body' => '{{student_name}} for being awesome in {{section_name}}!',
                    'footer' => '{{date}}',
                ],
            ],
            [
                'title' => 'Elegant Distinction',
                'design_id' => 'elegant-maroon',
                'content' => "CERTIFICATE OF DISTINCTION\n\n{{student_name}} for superior performance in {{section_name}}.",
                'variables' => ['student_name', 'section_name', 'date', 'degree'],
                'fields' => [
                    'heading' => 'CERTIFICATE OF DISTINCTION',
                    'subtitle' => 'This certificate is proudly presented to',
                    'body' => '{{student_name}} in recognition of superior performance.',
                    'footer' => '{{section_name}} · {{date}}',
                ],
            ],
        ];
    }

    public function run(): void
    {
        if (! \Illuminate\Support\Facades\Schema::connection('center')->hasTable('certification_templates')) {
            return;
        }

        foreach ($this->templates() as $data) {
            $design = $this->buildDesignSnapshot($data['design_id'], $data['fields']);

            CertificationTemplate::query()->updateOrCreate(
                ['title' => $data['title'], 'is_system' => true],
                [
                    'content' => $data['content'],
                    'variables' => $data['variables'],
                    'design_id' => $data['design_id'],
                    'design' => $design,
                    'is_system' => true,
                ],
            );
        }
    }

    /**
     * @param  array<string, string>  $fields
     * @return array<string, mixed>
     */
    private function buildDesignSnapshot(string $designId, array $fields): array
    {
        $presets = [
            'classic-gold' => ['primary' => '#92400e', 'secondary' => '#b45309', 'accent' => '#d97706', 'background' => '#fffbeb', 'backgroundEnd' => '#fef3c7', 'text' => '#1c1917', 'border' => '#b45309', 'borderStyle' => 'classic'],
            'classic-navy' => ['primary' => '#1e3a5f', 'secondary' => '#1e40af', 'accent' => '#3b82f6', 'background' => '#f0f9ff', 'backgroundEnd' => '#e0f2fe', 'text' => '#0f172a', 'border' => '#1e40af', 'borderStyle' => 'double'],
            'ornate-royal' => ['primary' => '#581c87', 'secondary' => '#7c3aed', 'accent' => '#a78bfa', 'background' => '#faf5ff', 'backgroundEnd' => '#f3e8ff', 'text' => '#3b0764', 'border' => '#7c3aed', 'borderStyle' => 'ornate'],
            'modern-teal' => ['primary' => '#0f766e', 'secondary' => '#14b8a6', 'accent' => '#2dd4bf', 'background' => '#f0fdfa', 'backgroundEnd' => '#ccfbf1', 'text' => '#134e4a', 'border' => '#14b8a6', 'borderStyle' => 'modern'],
            'elegant-maroon' => ['primary' => '#7f1d1d', 'secondary' => '#991b1b', 'accent' => '#dc2626', 'background' => '#fef2f2', 'backgroundEnd' => '#fee2e2', 'text' => '#450a0a', 'border' => '#991b1b', 'borderStyle' => 'ornate'],
            'academic-scroll' => ['primary' => '#365314', 'secondary' => '#4d7c0f', 'accent' => '#65a30d', 'background' => '#f7fee7', 'backgroundEnd' => '#ecfccb', 'text' => '#1a2e05', 'border' => '#4d7c0f', 'borderStyle' => 'academic'],
            'honor-black-gold' => ['primary' => '#ca8a04', 'secondary' => '#eab308', 'accent' => '#facc15', 'background' => '#18181b', 'backgroundEnd' => '#27272a', 'text' => '#fafafa', 'border' => '#ca8a04', 'borderStyle' => 'classic'],
            'participation-green' => ['primary' => '#15803d', 'secondary' => '#16a34a', 'accent' => '#4ade80', 'background' => '#f0fdf4', 'backgroundEnd' => '#bbf7d0', 'text' => '#14532d', 'border' => '#16a34a', 'borderStyle' => 'classic'],
            'professional-blue' => ['primary' => '#1d4ed8', 'secondary' => '#2563eb', 'accent' => '#3b82f6', 'background' => '#eff6ff', 'backgroundEnd' => '#dbeafe', 'text' => '#1e3a8a', 'border' => '#2563eb', 'borderStyle' => 'modern'],
            'arabic-gold' => ['primary' => '#854d0e', 'secondary' => '#a16207', 'accent' => '#ca8a04', 'background' => '#fefce8', 'backgroundEnd' => '#fef9c3', 'text' => '#422006', 'border' => '#a16207', 'borderStyle' => 'ornate'],
            'arabic-emerald' => ['primary' => '#047857', 'secondary' => '#059669', 'accent' => '#10b981', 'background' => '#ecfdf5', 'backgroundEnd' => '#d1fae5', 'text' => '#064e3b', 'border' => '#059669', 'borderStyle' => 'ornate'],
            'kids-colorful' => ['primary' => '#7c3aed', 'secondary' => '#2563eb', 'accent' => '#f59e0b', 'background' => '#fef3c7', 'backgroundEnd' => '#fce7f3', 'text' => '#1e1b4b', 'border' => '#8b5cf6', 'borderStyle' => 'ribbon'],
        ];

        $p = $presets[$designId] ?? $presets['classic-gold'];

        return [
            'presetId' => $designId,
            'orientation' => 'landscape',
            'colors' => [
                'primary' => $p['primary'],
                'secondary' => $p['secondary'],
                'accent' => $p['accent'],
                'background' => $p['background'],
                'backgroundEnd' => $p['backgroundEnd'] ?? null,
                'text' => $p['text'],
                'border' => $p['border'],
            ],
            'fonts' => ['heading' => 'Georgia, serif', 'body' => 'Georgia, serif'],
            'layout' => [
                'showLogo' => true,
                'showSeal' => true,
                'showBorder' => true,
                'borderStyle' => $p['borderStyle'],
                'headerAlign' => 'center',
            ],
            'fields' => $fields,
        ];
    }
}
