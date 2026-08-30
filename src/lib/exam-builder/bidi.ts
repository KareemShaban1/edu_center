/** True when the string contains Arabic script characters. */
export function hasArabicScript(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

/** Direction for a line of exam text inside an RTL page. */
export function textDirection(text: string): 'rtl' | 'ltr' {
  return hasArabicScript(text) ? 'rtl' : 'ltr';
}
