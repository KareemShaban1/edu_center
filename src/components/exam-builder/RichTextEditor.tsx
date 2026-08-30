import { useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Eraser,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';

type Align = 'left' | 'center' | 'right';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeightClass?: string;
  align?: Align;
  onAlignChange?: (align: Align) => void;
  showAlignControl?: boolean;
}

function ToolbarButton({
  title,
  active,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="icon"
      className="h-8 w-8"
      title={title}
      onMouseDown={e => {
        e.preventDefault();
        onClick();
      }}
    >
      {children}
    </Button>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  minHeightClass = 'min-h-[120px]',
  align,
  onAlignChange,
  showAlignControl = false,
}: RichTextEditorProps) {
  const { t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const run = (command: string, commandValue?: string) => {
    document.execCommand(command, false, commandValue);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div className={cn('overflow-hidden rounded-lg border border-input bg-background', className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/40 p-1">
        <ToolbarButton title={t('examBuilder.tool.bold')} onClick={() => run('bold')}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title={t('examBuilder.tool.italic')} onClick={() => run('italic')}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title={t('examBuilder.tool.underline')} onClick={() => run('underline')}>
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" />
        {showAlignControl && onAlignChange ? (
          <>
            <ToolbarButton title={t('examBuilder.align.left')} active={align === 'left'} onClick={() => onAlignChange('left')}>
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton title={t('examBuilder.align.center')} active={align === 'center'} onClick={() => onAlignChange('center')}>
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton title={t('examBuilder.align.right')} active={align === 'right'} onClick={() => onAlignChange('right')}>
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>
          </>
        ) : (
          <>
            <ToolbarButton title={t('examBuilder.align.left')} onClick={() => run('justifyLeft')}>
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton title={t('examBuilder.align.center')} onClick={() => run('justifyCenter')}>
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton title={t('examBuilder.align.right')} onClick={() => run('justifyRight')}>
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>
          </>
        )}
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton title={t('examBuilder.tool.bulletList')} onClick={() => run('insertUnorderedList')}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title={t('examBuilder.tool.numberedList')} onClick={() => run('insertOrderedList')}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton title={t('examBuilder.tool.undo')} onClick={() => run('undo')}>
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title={t('examBuilder.tool.redo')} onClick={() => run('redo')}>
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title={t('examBuilder.tool.clear')} onClick={() => run('removeFormat')}>
          <Eraser className="h-4 w-4" />
        </ToolbarButton>
        <select
          className="ms-auto h-8 rounded-md border border-input bg-background px-2 text-xs"
          defaultValue="3"
          title={t('examBuilder.tool.fontSize')}
          onChange={e => run('fontSize', e.target.value)}
        >
          <option value="2">{t('examBuilder.fontSize.small')}</option>
          <option value="3">{t('examBuilder.fontSize.normal')}</option>
          <option value="4">{t('examBuilder.fontSize.large')}</option>
          <option value="5">{t('examBuilder.fontSize.xlarge')}</option>
        </select>
      </div>
      <div
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline
        data-placeholder={placeholder}
        className={cn(
          'prose prose-sm max-w-none px-3 py-2 text-sm outline-none empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
          minHeightClass,
          align === 'left' && 'text-left',
          align === 'center' && 'text-center',
          align === 'right' && 'text-right',
        )}
        onInput={() => {
          if (ref.current) onChange(ref.current.innerHTML);
        }}
        onBlur={() => {
          if (ref.current) onChange(ref.current.innerHTML);
        }}
      />
    </div>
  );
}
