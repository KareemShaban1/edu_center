<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Exam;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\Element\AbstractContainer;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\Settings as PhpWordSettings;
use PhpOffice\PhpWord\Shared\Html;
use PhpOffice\PhpWord\SimpleType\Jc;
use PhpOffice\PhpWord\SimpleType\JcTable;
use PhpOffice\PhpWord\SimpleType\TblWidth;
use PhpOffice\PhpWord\Style\Language;
use PhpOffice\PhpWord\Style\Table as TableStyle;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class ExamExportService
{
    public function __construct(
        private readonly ExamBankService $examBankService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public static function defaultLayout(): array
    {
        return [
            'header' => [
                'enabled' => false,
                'html' => '',
                'align' => 'center',
            ],
            'footer' => [
                'enabled' => false,
                'html' => '',
                'align' => 'center',
            ],
            'body' => [
                'instructions_html' => '',
                'show_answers' => false,
                'number_questions' => true,
                'font_family' => "'Hajeen', 'Cairo', sans-serif",
                'font_size' => 12,
                'answer_marker_style' => 'letter_paren',
                'answers_per_row' => 1,
                'content_direction' => 'rtl',
                'question_spacing' => 16,
                'question_divider' => false,
                'short_answer_lines' => 1,
            ],
            'page' => [
                'margin_mm' => 15,
                'orientation' => 'P',
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $layout
     * @return array<string, mixed>
     */
    public static function normalizeLayout(array $layout): array
    {
        $defaults = self::defaultLayout();
        $alignments = ['left', 'center', 'right'];

        $headerAlign = (string) ($layout['header']['align'] ?? $defaults['header']['align']);
        $footerAlign = (string) ($layout['footer']['align'] ?? $defaults['footer']['align']);
        $markerStyles = [
            'letter_paren', 'letter_dot', 'letter_only',
            'number_paren', 'number_dot',
            'arabic_paren', 'arabic_dot',
            'bullet', 'dash',
        ];
        $markerStyle = (string) ($layout['body']['answer_marker_style'] ?? $defaults['body']['answer_marker_style']);
        $contentDirection = (string) ($layout['body']['content_direction'] ?? $defaults['body']['content_direction']);

        return [
            'header' => [
                'enabled' => (bool) ($layout['header']['enabled'] ?? false),
                'html' => (string) ($layout['header']['html'] ?? ''),
                'align' => in_array($headerAlign, $alignments, true) ? $headerAlign : 'center',
            ],
            'footer' => [
                'enabled' => (bool) ($layout['footer']['enabled'] ?? false),
                'html' => (string) ($layout['footer']['html'] ?? ''),
                'align' => in_array($footerAlign, $alignments, true) ? $footerAlign : 'center',
            ],
            'body' => [
                'instructions_html' => (string) ($layout['body']['instructions_html'] ?? ''),
                'show_answers' => (bool) ($layout['body']['show_answers'] ?? false),
                'number_questions' => (bool) ($layout['body']['number_questions'] ?? true),
                'font_family' => (string) ($layout['body']['font_family'] ?? $defaults['body']['font_family']),
                'font_size' => max(8, min(24, (int) ($layout['body']['font_size'] ?? 12))),
                'answer_marker_style' => in_array($markerStyle, $markerStyles, true)
                    ? $markerStyle
                    : $defaults['body']['answer_marker_style'],
                'answers_per_row' => max(1, min(4, (int) ($layout['body']['answers_per_row'] ?? 1))),
                'content_direction' => $contentDirection === 'ltr' ? 'ltr' : 'rtl',
                'question_spacing' => max(4, min(48, (int) ($layout['body']['question_spacing'] ?? 16))),
                'question_divider' => (bool) ($layout['body']['question_divider'] ?? false),
                'short_answer_lines' => max(1, min(8, (int) ($layout['body']['short_answer_lines'] ?? 1))),
            ],
            'page' => [
                'margin_mm' => max(5, min(40, (int) ($layout['page']['margin_mm'] ?? 15))),
                'orientation' => (($layout['page']['orientation'] ?? 'P') === 'L') ? 'L' : 'P',
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $layout
     * @return array<string, mixed>
     */
    public function updateLayout(int $examId, array $layout): array
    {
        $exam = $this->examBankService->find($examId);

        if (! Schema::connection('center')->hasColumn('exams', 'layout')) {
            throw new HttpResponseException(response()->json(['message' => 'Exam layout is not available'], 422));
        }

        $exam->layout = self::normalizeLayout($layout);
        $exam->save();

        return $this->examBankService->formatExam($exam->fresh(['questions.answers', 'lessons']));
    }

    public function export(int $examId, string $format): StreamedResponse|\Illuminate\Http\Response
    {
        $exam = $this->examBankService->find($examId);
        $layout = self::normalizeLayout(is_array($exam->layout) ? $exam->layout : []);
        $filename = Str::slug($exam->name ?: 'exam').'-'.$exam->id;

        return match (strtolower($format)) {
            'pdf' => $this->exportPdf($exam, $layout, $filename),
            'docx', 'word' => $this->exportDocx($exam, $layout, $filename),
            default => throw new HttpResponseException(response()->json(['message' => 'Unsupported export format'], 422)),
        };
    }

    /**
     * Questions/answers direction from layout (not UI locale).
     *
     * @param  array<string, mixed>  $layout
     */
    private function contentIsRtl(array $layout): bool
    {
        return (($layout['body']['content_direction'] ?? 'rtl') !== 'ltr');
    }

    private function hasArabicScript(string $text): bool
    {
        return preg_match('/\p{Arabic}/u', $text) === 1;
    }

    /**
     * Wrap plain text so Latin keeps LTR punctuation inside an RTL page.
     */
    private function bidiSafeHtml(string $text): string
    {
        $escaped = $this->e($text);
        if ($text === '') {
            return '';
        }

        if ($this->hasArabicScript($text)) {
            return '<span dir="rtl" style="unicode-bidi:isolate;">'.$escaped.'</span>';
        }

        return '<span dir="ltr" style="unicode-bidi:isolate;">'.$escaped.'</span>';
    }

    private function cssAlign(string $align): string
    {
        return match ($align) {
            'left', 'right', 'center' => $align,
            default => 'center',
        };
    }

    /**
     * @param  array<string, mixed>  $layout
     */
    private function exportPdf(Exam $exam, array $layout, string $filename): \Illuminate\Http\Response
    {
        $html = $this->buildHtmlDocument($exam, $layout);
        $rtl = $this->contentIsRtl($layout);
        $margin = (int) $layout['page']['margin_mm'];

        $config = [
            'mode' => 'utf-8',
            'format' => 'A4',
            'orientation' => $layout['page']['orientation'],
            'margin_left' => $margin,
            'margin_right' => $margin,
            'margin_top' => $margin + ($layout['header']['enabled'] ? 8 : 0),
            'margin_bottom' => $margin + ($layout['footer']['enabled'] ? 8 : 0),
            'default_font' => 'dejavusans',
            'auto_language_detection' => false,
        ];

        $pdf = app('laravel-mpdf')->getPdf($config);
        $mpdf = $pdf->getMpdf();
        $mpdf->SetDirectionality($rtl ? 'rtl' : 'ltr');
        $mpdf->WriteHTML($html);

        return $pdf->download($filename.'.pdf');
    }

    /**
     * @param  array<string, mixed>  $layout
     */
    private function exportDocx(Exam $exam, array $layout, string $filename): StreamedResponse
    {
        $rtl = $this->contentIsRtl($layout);
        $phpWord = new PhpWord();
        $wordFont = $this->resolveWordFontName((string) $layout['body']['font_family'], $rtl);
        $phpWord->setDefaultFontName($wordFont);
        $phpWord->setDefaultFontSize((int) $layout['body']['font_size']);

        // Never force every run to RTL — that mirrors English. Control rtl per script chunk.
        PhpWordSettings::setDefaultRtl(null);

        if ($rtl) {
            $phpWord->getSettings()->setThemeFontLang(new Language(Language::EN_US, 'ar-SA', 'ar-SA'));
            $phpWord->setDefaultParagraphStyle([
                // With w:bidi, "start" is the right edge. "right" is treated as "end" → left.
                'alignment' => Jc::START,
                'bidi' => true,
                'spaceAfter' => 60,
            ]);
        }

        $twip = (int) round(((int) $layout['page']['margin_mm']) * 56.7);
        $section = $phpWord->addSection([
            'orientation' => $layout['page']['orientation'] === 'L' ? 'landscape' : 'portrait',
            'marginLeft' => $twip,
            'marginRight' => $twip,
            'marginTop' => $twip,
            'marginBottom' => $twip,
        ]);

        if ($layout['header']['enabled'] && trim(strip_tags($layout['header']['html'])) !== '') {
            $this->addHtmlSafely(
                $section->addHeader(),
                $this->wrapAlignedHtml($layout['header']['html'], (string) $layout['header']['align'], $rtl),
                $rtl
            );
        }

        if ($layout['footer']['enabled'] && trim(strip_tags($layout['footer']['html'])) !== '') {
            $this->addHtmlSafely(
                $section->addFooter(),
                $this->wrapAlignedHtml($layout['footer']['html'], (string) $layout['footer']['align'], $rtl),
                $rtl
            );
        }

        $baseFont = ['name' => $wordFont, 'rtl' => false];
        $this->addScriptAwareText(
            $section,
            (string) $exam->name,
            $baseFont + ['bold' => true, 'size' => ((int) $layout['body']['font_size']) + 4],
            ['alignment' => Jc::CENTER, 'bidi' => $rtl, 'spaceAfter' => 200],
            $rtl
        );

        if (trim(strip_tags($layout['body']['instructions_html'])) !== '') {
            $this->addHtmlSafely(
                $section,
                $this->wrapAlignedHtml(
                    $layout['body']['instructions_html'],
                    $rtl ? 'right' : 'left',
                    $rtl
                ),
                $rtl
            );
            $section->addTextBreak(1);
        }

        $bodyParagraph = [
            'alignment' => $rtl ? Jc::START : Jc::LEFT,
            'bidi' => $rtl,
            'spaceBefore' => 120,
            'spaceAfter' => 60,
        ];

        $questionCount = $exam->questions->count();
        foreach ($exam->questions as $index => $question) {
            $prefix = $layout['body']['number_questions'] ? (($index + 1).'. ') : '';
            $this->addScriptAwareText(
                $section,
                $prefix.(string) $question->question_text,
                $baseFont + ['bold' => true],
                $bodyParagraph,
                $rtl
            );

            $this->addWordAnswers($section, $question, $layout, $rtl, $baseFont);

            if ($index < $questionCount - 1) {
                $this->addWordQuestionGap($section, $layout, $rtl);
            }
        }

        return response()->streamDownload(function () use ($phpWord, $rtl): void {
            $tmp = tempnam(sys_get_temp_dir(), 'examdocx');
            if ($tmp === false) {
                IOFactory::createWriter($phpWord, 'Word2007')->save('php://output');

                return;
            }

            $path = $tmp.'.docx';
            @unlink($tmp);
            IOFactory::createWriter($phpWord, 'Word2007')->save($path);

            if ($rtl) {
                $this->patchDocxRtl($path);
            }

            readfile($path);
            @unlink($path);
        }, $filename.'.docx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]);
    }

    /**
     * Add a paragraph with per-script runs so Arabic is RTL and English stays LTR (not mirrored).
     *
     * @param  array<string, mixed>  $fontStyle
     * @param  array<string, mixed>  $paragraphStyle
     */
    private function addScriptAwareText(
        AbstractContainer $container,
        string $text,
        array $fontStyle,
        array $paragraphStyle,
        bool $pageRtl
    ): void {
        if (! $pageRtl || ! $this->hasArabicScript($text)) {
            // Pure Latin (or LTR page): never mark the run as RTL.
            $container->addText($text, $fontStyle + ['rtl' => false], $paragraphStyle);

            return;
        }

        $run = $container->addTextRun($paragraphStyle);
        foreach ($this->splitByScript($text) as $chunk) {
            $run->addText($chunk['text'], $fontStyle + ['rtl' => $chunk['rtl']]);
        }
    }

    /**
     * @return list<array{text: string, rtl: bool}>
     */
    private function splitByScript(string $text): array
    {
        if ($text === '') {
            return [];
        }

        if (preg_match_all('/(\p{Arabic}+|[^\p{Arabic}]+)/u', $text, $matches) !== false) {
            $chunks = [];
            foreach ($matches[1] as $part) {
                if ($part === '') {
                    continue;
                }
                $chunks[] = [
                    'text' => $part,
                    'rtl' => $this->hasArabicScript($part),
                ];
            }

            return $chunks;
        }

        return [['text' => $text, 'rtl' => $this->hasArabicScript($text)]];
    }

    private function patchDocxRtl(string $path): void
    {
        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) {
            return;
        }

        $names = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if (is_string($name)) {
                $names[] = $name;
            }
        }

        foreach ($names as $name) {
            $xml = $zip->getFromName($name);
            if (! is_string($xml) || $xml === '') {
                continue;
            }

            $patched = match (true) {
                (bool) preg_match('#^word/(document|header\\d*|footer\\d*)\\.xml$#', $name) => $this->patchWordXmlRtl($xml),
                $name === 'word/styles.xml' => $this->patchWordStylesRtl($xml),
                $name === 'word/settings.xml' => $this->patchWordSettingsRtl($xml),
                default => null,
            };

            if (! is_string($patched) || $patched === $xml) {
                continue;
            }

            $zip->deleteName($name);
            $zip->addFromString($name, $patched);
        }

        $zip->close();
    }

    private function patchWordStylesRtl(string $xml): string
    {
        $ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
        $dom = new \DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);
        $loaded = $dom->loadXML($xml);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);
        if (! $loaded) {
            return $xml;
        }

        $xpath = new \DOMXPath($dom);
        $xpath->registerNamespace('w', $ns);
        $normal = $xpath->query("//w:style[@w:styleId='Normal' or @w:styleId='a']")?->item(0);
        if (! $normal instanceof \DOMElement) {
            $normal = $xpath->query("//w:style[@w:default='1']")?->item(0);
        }
        if (! $normal instanceof \DOMElement) {
            return $xml;
        }

        $pPr = null;
        foreach ($normal->childNodes as $child) {
            if ($child instanceof \DOMElement && $child->localName === 'pPr') {
                $pPr = $child;
                break;
            }
        }
        if ($pPr === null) {
            $pPr = $dom->createElementNS($ns, 'w:pPr');
            $normal->appendChild($pPr);
        }

        foreach (iterator_to_array($pPr->childNodes) as $child) {
            if ($child instanceof \DOMElement && in_array($child->localName, ['jc', 'bidi'], true)) {
                $pPr->removeChild($child);
            }
        }

        $pPr->appendChild($dom->createElementNS($ns, 'w:bidi'));
        $jc = $dom->createElementNS($ns, 'w:jc');
        $jc->setAttributeNS($ns, 'w:val', 'start');
        $pPr->appendChild($jc);

        $out = $dom->saveXML();

        return is_string($out) ? $out : $xml;
    }

    private function patchWordSettingsRtl(string $xml): string
    {
        if (str_contains($xml, 'w:themeFontLang')) {
            $xml = preg_replace(
                '/<w:themeFontLang\b[^>]*\/?>/',
                '<w:themeFontLang w:val="en-US" w:bidi="ar-SA"/>',
                $xml,
                1
            ) ?? $xml;
        } elseif (preg_match('/<w:settings\b[^>]*>/', $xml, $m, PREG_OFFSET_CAPTURE)) {
            $insertAt = $m[0][1] + strlen($m[0][0]);
            $xml = substr($xml, 0, $insertAt)
                .'<w:themeFontLang w:val="en-US" w:bidi="ar-SA"/>'
                .substr($xml, $insertAt);
        }

        return $xml;
    }

    private function patchWordXmlRtl(string $xml): string
    {
        $dom = new \DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);
        $loaded = $dom->loadXML($xml);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        if (! $loaded) {
            return $xml;
        }

        $ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
        $xpath = new \DOMXPath($dom);
        $xpath->registerNamespace('w', $ns);

        foreach ($xpath->query('//w:p') ?: [] as $paragraph) {
            if (! $paragraph instanceof \DOMElement) {
                continue;
            }

            $pPr = null;
            foreach ($paragraph->childNodes as $child) {
                if ($child instanceof \DOMElement && $child->localName === 'pPr') {
                    $pPr = $child;
                    break;
                }
            }

            if ($pPr === null) {
                $pPr = $dom->createElementNS($ns, 'w:pPr');
                $paragraph->insertBefore($pPr, $paragraph->firstChild);
            }

            $existingJc = null;
            foreach (iterator_to_array($pPr->childNodes) as $child) {
                if ($child instanceof \DOMElement && $child->localName === 'jc') {
                    $existingJc = $child->getAttribute('w:val') ?: $child->getAttributeNS($ns, 'val');
                    $pPr->removeChild($child);
                }
                if ($child instanceof \DOMElement && $child->localName === 'bidi') {
                    $pPr->removeChild($child);
                }
            }

            $pPr->appendChild($dom->createElementNS($ns, 'w:bidi'));
            $jc = $dom->createElementNS($ns, 'w:jc');
            // RTL + "right" is treated as "end" (left). "start" is the right edge.
            $jc->setAttributeNS($ns, 'w:val', $existingJc === 'center' ? 'center' : 'start');
            $pPr->appendChild($jc);
        }

        foreach ($xpath->query('//w:tblPr') ?: [] as $tblPr) {
            if (! $tblPr instanceof \DOMElement) {
                continue;
            }

            foreach (iterator_to_array($tblPr->childNodes) as $child) {
                if ($child instanceof \DOMElement && in_array($child->localName, ['jc', 'tblW'], true)) {
                    $tblPr->removeChild($child);
                }
            }

            $tblW = $dom->createElementNS($ns, 'w:tblW');
            $tblW->setAttributeNS($ns, 'w:w', '5000');
            $tblW->setAttributeNS($ns, 'w:type', 'pct');
            $tblPr->insertBefore($tblW, $tblPr->firstChild);

            $tblJc = $dom->createElementNS($ns, 'w:jc');
            $tblJc->setAttributeNS($ns, 'w:val', 'end');
            $tblPr->appendChild($tblJc);
        }

        foreach ($xpath->query('//w:r') ?: [] as $run) {
            if (! $run instanceof \DOMElement) {
                continue;
            }

            $text = '';
            foreach ($xpath->query('.//w:t', $run) ?: [] as $tNode) {
                $text .= $tNode->textContent;
            }

            $rPr = null;
            foreach ($run->childNodes as $child) {
                if ($child instanceof \DOMElement && $child->localName === 'rPr') {
                    $rPr = $child;
                    break;
                }
            }

            $isArabic = $text !== '' && $this->hasArabicScript($text);

            if (! $isArabic) {
                if ($rPr !== null) {
                    foreach (iterator_to_array($rPr->childNodes) as $child) {
                        if ($child instanceof \DOMElement && $child->localName === 'rtl') {
                            $rPr->removeChild($child);
                        }
                    }
                }

                continue;
            }

            if ($rPr === null) {
                $rPr = $dom->createElementNS($ns, 'w:rPr');
                $run->insertBefore($rPr, $run->firstChild);
            }

            $hasRtl = false;
            foreach ($rPr->childNodes as $child) {
                if ($child instanceof \DOMElement && $child->localName === 'rtl') {
                    $hasRtl = true;
                    break;
                }
            }

            if (! $hasRtl) {
                $rPr->appendChild($dom->createElementNS($ns, 'w:rtl'));
            }
        }

        $out = $dom->saveXML();

        return is_string($out) ? $out : $xml;
    }

    /**
     * @param  array<string, mixed>  $layout
     */
    private function buildHtmlDocument(Exam $exam, array $layout): string
    {
        $fontSize = (int) $layout['body']['font_size'];
        $rtl = $this->contentIsRtl($layout);
        $dir = $rtl ? 'rtl' : 'ltr';
        $bodyAlign = $rtl ? 'right' : 'left';
        $headerAlign = $this->cssAlign((string) $layout['header']['align']);
        $footerAlign = $this->cssAlign((string) $layout['footer']['align']);

        $headerHtml = '';
        if ($layout['header']['enabled'] && trim(strip_tags($layout['header']['html'])) !== '') {
            $headerHtml = '<div class="exam-header" style="text-align:'.e($headerAlign).';margin-bottom:16px;border-bottom:1px solid #ccc;padding-bottom:8px;direction:'.$dir.';">'
                .$this->sanitizeExportHtml($layout['header']['html'])
                .'</div>';
        }

        $footerHtml = '';
        if ($layout['footer']['enabled'] && trim(strip_tags($layout['footer']['html'])) !== '') {
            $footerHtml = '<div class="exam-footer" style="text-align:'.e($footerAlign).';margin-top:24px;border-top:1px solid #ccc;padding-top:8px;direction:'.$dir.';">'
                .$this->sanitizeExportHtml($layout['footer']['html'])
                .'</div>';
        }

        $instructions = '';
        if (trim(strip_tags($layout['body']['instructions_html'])) !== '') {
            $instructions = '<div class="instructions" style="margin-bottom:16px;text-align:'.$bodyAlign.';direction:'.$dir.';">'
                .$this->sanitizeExportHtml($layout['body']['instructions_html'])
                .'</div>';
        }

        $spacingPt = max(4, min(48, (int) ($layout['body']['question_spacing'] ?? 16)));
        $showDivider = (bool) ($layout['body']['question_divider'] ?? false);
        $questionCount = $exam->questions->count();
        $questionsHtml = '';
        foreach ($exam->questions as $index => $question) {
            $prefix = $layout['body']['number_questions'] ? (($index + 1).'. ') : '';
            $qText = $prefix.(string) $question->question_text;
            $isLast = $index === $questionCount - 1;
            $gap = $isLast ? 0 : $spacingPt;
            $dividerCss = (! $isLast && $showDivider)
                ? 'border-bottom:0.6pt solid #ccc;padding-bottom:6pt;'
                : '';
            $questionsHtml .= '<div class="question" style="margin-bottom:'.$gap.'pt;'.$dividerCss.'text-align:'.$bodyAlign.';">';
            $questionsHtml .= '<p style="font-weight:bold;margin:0 0 6px;font-family:dejavusans;">'
                .($rtl ? $this->bidiSafeHtml($qText) : $this->e($qText))
                .'</p>';
            $questionsHtml .= $this->buildAnswersBlockHtml($question, $layout, $rtl, $rtl);
            $questionsHtml .= '</div>';
        }

        $titleSize = $fontSize + 4;
        $examTitle = $rtl ? $this->bidiSafeHtml((string) $exam->name) : $this->e((string) $exam->name);
        $lang = $rtl ? 'ar' : 'en';

        return <<<HTML
<!DOCTYPE html>
<html dir="{$dir}" lang="{$lang}">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<style>
  body {
    font-family: dejavusans;
    font-size: {$fontSize}pt;
    color: #111;
    direction: {$dir};
    text-align: {$bodyAlign};
  }
  h1 {
    text-align: center;
    font-family: dejavusans;
    font-size: {$titleSize}pt;
    margin: 0 0 16px;
  }
  * { font-family: dejavusans !important; }
</style>
</head>
<body>
{$headerHtml}
<h1>{$examTitle}</h1>
{$instructions}
{$questionsHtml}
{$footerHtml}
</body>
</html>
HTML;
    }

    private function sanitizeExportHtml(string $html): string
    {
        $html = preg_replace('/font-family\s*:\s*[^;"]+;?/i', '', $html) ?? $html;
        $html = preg_replace('/\sstyle="\s*"/i', '', $html) ?? $html;

        return $html;
    }

    private function resolveWordFontName(string $cssFamily, bool $rtl): string
    {
        $normalized = trim(str_replace(["'", '"'], '', $cssFamily));
        $primary = trim(explode(',', $normalized)[0] ?? '');

        if ($primary === '' || strcasecmp($primary, 'DejaVu Sans') === 0) {
            return 'Arial';
        }

        if ($rtl && in_array(strtolower($primary), ['hajeen', 'cairo', 'tajawal', 'noto sans arabic'], true)) {
            return 'Arial';
        }

        return $primary !== '' ? $primary : 'Arial';
    }

    private function e(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private function wrapAlignedHtml(string $html, string $align, bool $rtl = false): string
    {
        $cssAlign = $this->cssAlign($align);
        $dir = $rtl ? 'rtl' : 'ltr';

        return '<div style="text-align:'.$this->e($cssAlign).';direction:'.$dir.';">'
            .$this->sanitizeExportHtml($html)
            .'</div>';
    }

    private function addHtmlSafely(AbstractContainer $container, string $html, bool $rtl = false): void
    {
        $xml = $this->htmlToXmlFragment($html);
        if ($xml === '') {
            return;
        }

        try {
            Html::addHtml($container, $xml, false, false);
        } catch (\Throwable) {
            $plain = trim(html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            if ($plain !== '') {
                $this->addScriptAwareText(
                    $container,
                    $plain,
                    ['rtl' => false],
                    ['alignment' => $rtl ? Jc::START : Jc::LEFT, 'bidi' => $rtl],
                    $rtl
                );
            }
        }
    }

    private function htmlToXmlFragment(string $html): string
    {
        $html = trim($html);
        if ($html === '') {
            return '';
        }

        if (trim(strip_tags($html)) === '' && ! preg_match('/<img\b/i', $html)) {
            return '';
        }

        $html = preg_replace('/<br\s*\/?>/i', '<br/>', $html) ?? $html;
        $html = preg_replace('/<hr\s*\/?>/i', '<hr/>', $html) ?? $html;
        $html = preg_replace('/<img\b([^>]*?)(?<!\/)\s*>/i', '<img$1/>', $html) ?? $html;

        $dom = new \DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);
        $loaded = $dom->loadHTML(
            '<?xml encoding="UTF-8"><div id="exam-html-root">'.$html.'</div>',
            LIBXML_HTML_NODEFDTD | LIBXML_NOERROR | LIBXML_NOWARNING
        );
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        if (! $loaded) {
            $plain = trim(html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8'));

            return $plain !== '' ? '<p>'.$this->e($plain).'</p>' : '';
        }

        $root = $dom->getElementById('exam-html-root');
        if ($root === null) {
            $plain = trim(html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8'));

            return $plain !== '' ? '<p>'.$this->e($plain).'</p>' : '';
        }

        $inner = '';
        foreach (iterator_to_array($root->childNodes) as $child) {
            $inner .= $dom->saveXML($child);
        }

        $inner = trim($inner);
        if ($inner === '') {
            return '';
        }

        if (! preg_match('/^<([a-zA-Z0-9]+)(\s[^>]*)?>[\s\S]*<\/\1>$/', $inner)
            && ! preg_match('/^<[a-zA-Z0-9]+(\s[^>]*)?\/>$/', $inner)) {
            return '<div>'.$inner.'</div>';
        }

        return $inner;
    }

    /**
     * @param  array<string, mixed>  $layout
     */
    private function addWordQuestionGap(AbstractContainer $section, array $layout, bool $rtl): void
    {
        $spacingTwip = max(4, min(48, (int) ($layout['body']['question_spacing'] ?? 16))) * 20;
        $showDivider = (bool) ($layout['body']['question_divider'] ?? false);
        $style = [
            'alignment' => $rtl ? Jc::START : Jc::LEFT,
            'bidi' => $rtl,
            'spaceBefore' => (int) round($spacingTwip / 2),
            'spaceAfter' => (int) round($spacingTwip / 2),
        ];
        if ($showDivider) {
            $style['borderBottomSize'] = 6;
            $style['borderBottomColor'] = 'cccccc';
        }

        $section->addText("\u{00A0}", ['size' => 2, 'color' => 'FFFFFF', 'rtl' => false], $style);
    }

    /**
     * @param  array<string, mixed>  $layout
     * @param  array<string, mixed>  $fontStyle
     */
    private function addWordAnswers(
        AbstractContainer $section,
        object $question,
        array $layout,
        bool $rtl,
        array $fontStyle
    ): void {
        $items = $this->answerItems($question, $layout);
        if ($items === []) {
            return;
        }

        $cols = $question->type === 'short_answer'
            ? 1
            : max(1, min(4, (int) ($layout['body']['answers_per_row'] ?? 1)));
        $paragraph = [
            'alignment' => $rtl ? Jc::START : Jc::LEFT,
            'bidi' => $rtl,
            'spaceAfter' => 40,
            'indentation' => [
                'left' => $rtl ? 0 : 200,
                'right' => 0,
            ],
        ];

        if ($cols === 1) {
            foreach ($items as $item) {
                if (! empty($item['blank'])) {
                    $this->addWordBlankAnswerLine($section, $rtl, $fontStyle);

                    continue;
                }
                $this->addWordAnswerRuns($section, $item['marker'], $item['text'], $item['correct'], $rtl, $fontStyle, $paragraph);
            }

            return;
        }

        // Multi-column: one row table; reverse cell order in RTL so first answer is on the right.
        $table = $section->addTable([
            'borderSize' => 0,
            'cellMargin' => 40,
            'width' => 5000,
            'unit' => TblWidth::PERCENT,
            'layout' => TableStyle::LAYOUT_FIXED,
            'bidiVisual' => false,
            'alignment' => $rtl ? JcTable::END : JcTable::START,
        ]);
        $cellWidth = (int) floor(5000 / $cols);

        foreach (array_chunk($items, $cols) as $rowItems) {
            $ordered = $rtl ? array_reverse($rowItems) : $rowItems;
            $row = $table->addRow();
            foreach ($ordered as $item) {
                $cell = $row->addCell($cellWidth, ['vAlign' => 'top']);
                if (! empty($item['blank'])) {
                    $this->addWordBlankAnswerLine($cell, $rtl, $fontStyle);
                } else {
                    $this->addWordAnswerRuns($cell, $item['marker'], $item['text'], $item['correct'], $rtl, $fontStyle, $paragraph);
                }
            }
            for ($pad = count($ordered); $pad < $cols; $pad++) {
                $row->addCell($cellWidth);
            }
        }
    }

    /**
     * Full-width dotted writing line for short-answer blanks.
     *
     * @param  array<string, mixed>  $fontStyle
     */
    private function addWordBlankAnswerLine(AbstractContainer $container, bool $rtl, array $fontStyle): void
    {
        $size = max(8, (int) ($fontStyle['size'] ?? 12));
        $container->addText(
            "\u{00A0}",
            ['size' => $size, 'color' => 'FFFFFF', 'rtl' => false],
            [
                'alignment' => $rtl ? Jc::START : Jc::LEFT,
                'bidi' => $rtl,
                'spaceBefore' => 80,
                'spaceAfter' => 80,
                'borderBottomSize' => 8,
                'borderBottomColor' => '333333',
                'borderBottomStyle' => 'dotted',
            ]
        );
    }

    /**
     * Marker run first, answer run second. With paragraph bidi+right, marker sits on the right
     * (like the PDF) without mirroring Latin letters.
     *
     * @param  array<string, mixed>  $fontStyle
     * @param  array<string, mixed>  $paragraph
     */
    private function addWordAnswerRuns(
        AbstractContainer $container,
        string $marker,
        string $text,
        bool $correct,
        bool $rtl,
        array $fontStyle,
        array $paragraph
    ): void {
        $label = $text.($correct ? ' [+]' : '');

        if ($marker === '') {
            $this->addScriptAwareText($container, $label, $fontStyle, $paragraph, $rtl);

            return;
        }

        if (! $rtl) {
            $container->addText(
                $marker.' '.$label,
                $fontStyle + ['rtl' => false],
                $paragraph
            );

            return;
        }

        $run = $container->addTextRun($paragraph);
        $run->addText($marker.' ', $fontStyle + ['rtl' => false, 'bold' => true]);

        if ($this->hasArabicScript($label)) {
            foreach ($this->splitByScript($label) as $chunk) {
                $run->addText($chunk['text'], $fontStyle + ['rtl' => $chunk['rtl']]);
            }
        } else {
            $run->addText($label, $fontStyle + ['rtl' => false]);
        }
    }

    /**
     * @param  array<string, mixed>  $layout
     * @return list<array{marker: string, text: string, correct: bool, blank?: bool}>
     */
    private function answerItems(object $question, array $layout): array
    {
        $style = (string) ($layout['body']['answer_marker_style'] ?? 'letter_paren');
        $showCorrect = (bool) ($layout['body']['show_answers'] ?? false);
        $answers = $question->answers ?? [];
        $items = [];

        if ($question->type === 'short_answer') {
            if ($showCorrect) {
                $items = [];
                foreach ($answers as $answer) {
                    $items[] = [
                        'marker' => '',
                        'text' => (string) $answer->answer_text,
                        'correct' => false,
                        'blank' => false,
                    ];
                }

                return $items !== [] ? $items : [[
                    'marker' => '',
                    'text' => '',
                    'correct' => false,
                    'blank' => true,
                ]];
            }

            $lines = max(1, min(8, (int) ($layout['body']['short_answer_lines'] ?? 1)));
            $items = [];
            for ($i = 0; $i < $lines; $i++) {
                $items[] = [
                    'marker' => '',
                    'text' => '',
                    'correct' => false,
                    'blank' => true,
                ];
            }

            return $items;
        }

        foreach ($answers as $answerIndex => $answer) {
            $items[] = [
                'marker' => $this->answerMarker($question->type, (int) $answerIndex, $style),
                'text' => (string) $answer->answer_text,
                'correct' => $showCorrect && (bool) $answer->is_correct,
                'blank' => false,
            ];
        }

        return $items;
    }

    /**
     * @param  array<string, mixed>  $layout
     */
    private function buildAnswersBlockHtml(object $question, array $layout, bool $rtl, bool $pdfTablesReversed = false): string
    {
        $items = $this->answerItems($question, $layout);
        if ($items === []) {
            return '';
        }

        $cols = $question->type === 'short_answer'
            ? 1
            : max(1, min(4, (int) ($layout['body']['answers_per_row'] ?? 1)));
        $width = (int) floor(100 / $cols);
        $html = '<table width="100%" style="width:100%;border:none;border-collapse:collapse;margin:0 0 8px;"><tbody>';
        foreach (array_chunk($items, $cols) as $row) {
            $html .= '<tr>';
            foreach ($row as $item) {
                $html .= '<td style="vertical-align:top;padding:2px 0 6px 0;width:'.$width.'%;border:none;">'
                    .(! empty($item['blank'])
                        ? $this->buildBlankAnswerLineHtml()
                        : $this->buildAnswerLineHtml(
                            $item['marker'],
                            $item['text'],
                            $rtl,
                            $item['correct'],
                            $pdfTablesReversed
                        ))
                    .'</td>';
            }
            for ($pad = count($row); $pad < $cols; $pad++) {
                $html .= '<td style="width:'.$width.'%;border:none;"></td>';
            }
            $html .= '</tr>';
        }
        $html .= '</tbody></table>';

        return $html;
    }

    private function buildBlankAnswerLineHtml(): string
    {
        return '<div style="width:100%;border-bottom:1.2pt dotted #333;height:16pt;margin:2pt 0 4pt;"></div>';
    }

    /**
     * Two-cell table so the marker stays on the reading-start side.
     * mPDF SetDirectionality(rtl) reverses table columns; Word tables do not.
     */
    private function buildAnswerLineHtml(
        string $marker,
        string $text,
        bool $pageRtl,
        bool $correct,
        bool $tableColumnsReversed
    ): string {
        $textDir = $this->hasArabicScript($text) ? 'rtl' : 'ltr';
        $correctHtml = $correct
            ? ' <span dir="ltr">[+]</span>'
            : '';
        $textCell = '<td style="vertical-align:top;padding:0;border:none;" dir="'.$textDir.'">'
            .$this->e($text)
            .$correctHtml
            .'</td>';

        if ($marker === '') {
            return '<table width="100%" style="width:100%;border:none;border-collapse:collapse;"><tr>'.$textCell.'</tr></table>';
        }

        $markerCell = '<td style="vertical-align:top;white-space:nowrap;width:28px;padding:0 4px;border:none;font-weight:bold;" dir="ltr">'
            .$this->e($marker)
            .'</td>';

        $markerFirst = ! ($pageRtl xor $tableColumnsReversed);

        return '<table width="100%" style="width:100%;border:none;border-collapse:collapse;"><tr>'
            .($markerFirst ? $markerCell.$textCell : $textCell.$markerCell)
            .'</tr></table>';
    }

    private function answerMarker(string $type, int $index, string $style = 'letter_paren'): string
    {
        if ($type === 'true_false') {
            return '○';
        }
        if ($type === 'short_answer') {
            return '';
        }

        $letter = chr(65 + $index);
        $arabicLetters = [
            'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي',
        ];
        $arabic = $arabicLetters[$index % count($arabicLetters)];
        $num = $index + 1;

        return match ($style) {
            'letter_dot' => $letter.'.',
            'letter_only' => $letter,
            'number_paren' => $num.')',
            'number_dot' => $num.'.',
            'arabic_paren' => $arabic.')',
            'arabic_dot' => $arabic.'.',
            'bullet' => '•',
            'dash' => '-',
            default => $letter.')',
        };
    }
}
