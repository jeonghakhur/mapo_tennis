'use client';

import * as React from 'react';
import { type Editor } from '@tiptap/react';

// --- Hooks ---
import { useMenuNavigation } from '@/hooks/use-menu-navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTiptapEditor } from '@/hooks/use-tiptap-editor';

// --- Icons ---
import { BanIcon } from '@/components/tiptap-icons/ban-icon';
import { HighlighterIcon } from '@/components/tiptap-icons/highlighter-icon';

// --- UI Primitives ---
import type { ButtonProps } from '@/components/tiptap-ui-primitive/button';
import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Separator } from '@/components/tiptap-ui-primitive/separator';
import { Card, CardBody, CardItemGroup } from '@/components/tiptap-ui-primitive/card';

// --- Tiptap UI ---
import type {
  HighlightColor,
  UseColorHighlightConfig,
} from '@/components/tiptap-ui/color-highlight-button';
import {
  ColorHighlightButton,
  pickHighlightColorsByValue,
  useColorHighlight,
} from '@/components/tiptap-ui/color-highlight-button';

export interface ColorHighlightPopoverContentProps {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null;
  /**
   * Optional colors to use in the highlight popover.
   * If not provided, defaults to a predefined set of colors.
   */
  colors?: HighlightColor[];
}

export interface ColorHighlightPopoverProps
  extends Omit<ButtonProps, 'type'>,
    Pick<UseColorHighlightConfig, 'editor' | 'hideWhenUnavailable' | 'onApplied'> {
  /**
   * Optional colors to use in the highlight popover.
   * If not provided, defaults to a predefined set of colors.
   */
  colors?: HighlightColor[];
}

export const ColorHighlightPopoverButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => (
    <Button
      type="button"
      className={className}
      data-style="ghost"
      data-appearance="default"
      role="button"
      tabIndex={-1}
      aria-label="Highlight text"
      tooltip="Highlight"
      ref={ref}
      {...props}
    >
      {children ?? <HighlighterIcon className="tiptap-button-icon" />}
    </Button>
  ),
);

ColorHighlightPopoverButton.displayName = 'ColorHighlightPopoverButton';

export function ColorHighlightPopoverContent({
  editor,
  colors = pickHighlightColorsByValue([
    'var(--tt-color-highlight-green)',
    'var(--tt-color-highlight-blue)',
    'var(--tt-color-highlight-red)',
    'var(--tt-color-highlight-purple)',
    'var(--tt-color-highlight-yellow)',
  ]),
}: ColorHighlightPopoverContentProps) {
  const { handleRemoveHighlight } = useColorHighlight({ editor });
  const isMobile = useIsMobile();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const menuItems = React.useMemo(
    () => [...colors, { label: 'Remove highlight', value: 'none' }],
    [colors],
  );

  const { selectedIndex } = useMenuNavigation({
    containerRef,
    items: menuItems,
    orientation: 'both',
    onSelect: (item) => {
      if (!containerRef.current) return false;
      const highlightedElement = containerRef.current.querySelector(
        '[data-highlighted="true"]',
      ) as HTMLElement;
      if (highlightedElement) highlightedElement.click();
      if (item.value === 'none') handleRemoveHighlight();
    },
    autoSelectFirstItem: false,
  });

  return (
    <Card ref={containerRef} tabIndex={0} style={isMobile ? { boxShadow: 'none', border: 0 } : {}}>
      <CardBody style={isMobile ? { padding: 0 } : {}}>
        <CardItemGroup orientation="horizontal">
          <ButtonGroup orientation="horizontal">
            {colors.map((color, index) => (
              <ColorHighlightButton
                key={color.value}
                editor={editor}
                highlightColor={color.value}
                tooltip={color.label}
                aria-label={`${color.label} highlight color`}
                tabIndex={index === selectedIndex ? 0 : -1}
                data-highlighted={selectedIndex === index}
              />
            ))}
          </ButtonGroup>
          <Separator />
          <ButtonGroup orientation="horizontal">
            <Button
              onClick={handleRemoveHighlight}
              aria-label="Remove highlight"
              tooltip="Remove highlight"
              tabIndex={selectedIndex === colors.length ? 0 : -1}
              type="button"
              role="menuitem"
              data-style="ghost"
              data-highlighted={selectedIndex === colors.length}
            >
              <BanIcon className="tiptap-button-icon" />
            </Button>
          </ButtonGroup>
        </CardItemGroup>
      </CardBody>
    </Card>
  );
}

export function ColorHighlightPopover({
  editor: providedEditor,
  colors = pickHighlightColorsByValue([
    'var(--tt-color-highlight-green)',
    'var(--tt-color-highlight-blue)',
    'var(--tt-color-highlight-red)',
    'var(--tt-color-highlight-purple)',
    'var(--tt-color-highlight-yellow)',
  ]),
  hideWhenUnavailable = false,
  onApplied,
  ...props
}: ColorHighlightPopoverProps) {
  const { editor } = useTiptapEditor(providedEditor);
  const [isOpen, setIsOpen] = React.useState(false);

  // 현재 선택된 하이라이트 색상 찾기
  const getCurrentHighlightColor = () => {
    if (!editor) return null;

    // 현재 선택된 텍스트에서 하이라이트 색상 확인
    const { from, to } = editor.state.selection;
    let currentColor = null;

    // 선택된 범위에서 하이라이트 마크 찾기
    editor.state.doc.nodesBetween(from, to, (node) => {
      if (node.marks) {
        node.marks.forEach((mark) => {
          if (mark.type.name === 'highlight' && mark.attrs.color) {
            currentColor = mark.attrs.color;
          }
        });
      }
    });

    // 선택된 범위에 하이라이트가 없으면 커서 위치에서 확인
    if (!currentColor && from === to) {
      const $pos = editor.state.doc.resolve(from);
      $pos.marks().forEach((mark) => {
        if (mark.type.name === 'highlight' && mark.attrs.color) {
          currentColor = mark.attrs.color;
        }
      });
    }

    return currentColor;
  };

  const currentHighlightColor = getCurrentHighlightColor();

  const { isVisible, canColorHighlight, isActive, label, Icon } = useColorHighlight({
    editor,
    highlightColor: currentHighlightColor || undefined,
    hideWhenUnavailable,
    onApplied,
  });

  if (!isVisible) return null;

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <PopoverPrimitive.Trigger asChild>
        <ColorHighlightPopoverButton
          disabled={!canColorHighlight}
          data-active-state={isActive ? 'on' : 'off'}
          data-disabled={!canColorHighlight}
          aria-pressed={isActive}
          aria-label={label}
          tooltip={label}
          {...props}
        >
          <Icon className="tiptap-button-icon" />
        </ColorHighlightPopoverButton>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="z-50 w-80 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          sideOffset={5}
          aria-label="Highlight colors"
        >
          <ColorHighlightPopoverContent editor={editor} colors={colors} />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export default ColorHighlightPopover;
