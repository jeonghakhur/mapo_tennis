'use client';

import * as React from 'react';

// --- Hooks ---
import { useTiptapEditor } from '@/hooks/use-tiptap-editor';

// --- UI Primitives ---
import type { ButtonProps } from '@/components/tiptap-ui-primitive/button';
import { Button } from '@/components/tiptap-ui-primitive/button';

// --- Icons ---
import { HeadingIcon } from '@/components/tiptap-icons/heading-icon';

// --- Styles ---
import './font-size-button.scss';

export interface FontSizeButtonProps extends Omit<ButtonProps, 'type'> {
  /**
   * The Tiptap editor instance.
   */
  editor?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  /**
   * The font size to apply to the text.
   */
  fontSize?: string;
  /**
   * Optional label to display alongside the icon.
   */
  label?: string;
  /**
   * Whether the button should hide when the mark is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean;
  /**
   * Called when the font size is applied.
   */
  onApplied?: ({ size, label }: { size: string; label: string }) => void;
}

/**
 * Button component for applying font sizes in a Tiptap editor.
 */
export const FontSizeButton = React.forwardRef<HTMLButtonElement, FontSizeButtonProps>(
  (
    {
      editor: providedEditor,
      fontSize,
      label,
      hideWhenUnavailable = false,
      onApplied,
      onClick,
      children,
      style,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor(providedEditor);

    const handleFontSize = React.useCallback(() => {
      if (!editor || !fontSize || !label) return false;

      const success = editor.chain().focus().setMark('textStyle', { fontSize }).run();

      if (success) {
        onApplied?.({ size: fontSize, label });
      }
      return success;
    }, [editor, fontSize, label, onApplied]);

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        handleFontSize();
      },
      [handleFontSize, onClick],
    );

    const buttonStyle = React.useMemo(
      () =>
        ({
          ...style,
          '--font-size': fontSize,
        }) as React.CSSProperties,
      [fontSize, style],
    );

    const isActive =
      editor?.isActive('textStyle', { fontSize }) ||
      editor?.getAttributes('textStyle').fontSize === fontSize ||
      false;
    const canApplyFontSize = editor?.isEditable && fontSize;

    if (!canApplyFontSize && hideWhenUnavailable) {
      return null;
    }

    return (
      <Button
        type="button"
        data-style="ghost"
        data-active-state={isActive ? 'on' : 'off'}
        role="button"
        tabIndex={-1}
        disabled={!canApplyFontSize}
        data-disabled={!canApplyFontSize}
        aria-label={label || `Apply ${fontSize} font size`}
        aria-pressed={isActive}
        tooltip={label || `Apply ${fontSize} font size`}
        onClick={handleClick}
        style={buttonStyle}
        data-selected={isActive}
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <>
            <span className="tiptap-button-font-size" style={buttonStyle}>
              {fontSize}
            </span>
            <HeadingIcon className="tiptap-button-icon" />
          </>
        )}
      </Button>
    );
  },
);

FontSizeButton.displayName = 'FontSizeButton';
