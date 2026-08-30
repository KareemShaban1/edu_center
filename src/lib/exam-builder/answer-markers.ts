export type AnswerMarkerStyle =
  | 'letter_paren'
  | 'letter_dot'
  | 'letter_only'
  | 'number_paren'
  | 'number_dot'
  | 'arabic_paren'
  | 'arabic_dot'
  | 'bullet'
  | 'dash';

export const ANSWER_MARKER_STYLES: AnswerMarkerStyle[] = [
  'letter_paren',
  'letter_dot',
  'letter_only',
  'number_paren',
  'number_dot',
  'arabic_paren',
  'arabic_dot',
  'bullet',
  'dash',
];

const ARABIC_LETTERS = [
  'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي',
];

export function formatAnswerMarker(
  style: AnswerMarkerStyle,
  index: number,
  questionType?: string,
): string {
  if (questionType === 'true_false') {
    return '○';
  }
  if (questionType === 'short_answer') {
    return '';
  }

  const letter = String.fromCharCode(65 + index);
  const arabic = ARABIC_LETTERS[index % ARABIC_LETTERS.length];
  const num = index + 1;

  switch (style) {
    case 'letter_dot':
      return `${letter}.`;
    case 'letter_only':
      return letter;
    case 'number_paren':
      return `${num})`;
    case 'number_dot':
      return `${num}.`;
    case 'arabic_paren':
      return `${arabic})`;
    case 'arabic_dot':
      return `${arabic}.`;
    case 'bullet':
      return '•';
    case 'dash':
      return '-';
    case 'letter_paren':
    default:
      return `${letter})`;
  }
}

export function clampAnswersPerRow(value: number): number {
  return Math.max(1, Math.min(4, Math.round(value) || 1));
}

export function clampShortAnswerLines(value: number): number {
  return Math.max(1, Math.min(8, Math.round(value) || 1));
}
