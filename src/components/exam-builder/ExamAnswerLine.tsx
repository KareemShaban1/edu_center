type ExamAnswerLineProps = {
  marker: string;
  text: string;
  pageDir: 'rtl' | 'ltr';
  showCorrect?: boolean;
  isCorrect?: boolean;
  /** Full-width dotted writing line (short-answer blanks). */
  blank?: boolean;
};

/**
 * Aligns the answer line to the exam content direction (RTL = right, LTR = left).
 * Marker stays LTR so "A)" is not reversed.
 */
export default function ExamAnswerLine({
  marker,
  text,
  pageDir,
  showCorrect,
  isCorrect,
  blank,
}: ExamAnswerLineProps) {
  if (blank) {
    return (
      <div
        className="w-full"
        dir={pageDir}
        style={{
          borderBottom: '1.5px dotted #333',
          minHeight: '1.35em',
          marginTop: '0.15em',
          marginBottom: '0.15em',
        }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className="flex w-full items-start gap-1.5"
      dir={pageDir}
      style={{ justifyContent: 'flex-start', textAlign: pageDir === 'rtl' ? 'right' : 'left' }}
    >
      {marker ? (
        <span
          dir="ltr"
          className="shrink-0 select-none font-medium"
          style={{ unicodeBidi: 'isolate' }}
        >
          {marker}
        </span>
      ) : null}
      <span dir={pageDir}>
        {text}
        {showCorrect && isCorrect ? ' ✓' : ''}
      </span>
    </div>
  );
}
