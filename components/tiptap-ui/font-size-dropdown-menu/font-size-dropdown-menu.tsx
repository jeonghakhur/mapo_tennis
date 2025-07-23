'use client';

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

// --- Hooks ---
import { useTiptapEditor } from '@/hooks/use-tiptap-editor';

// --- UI Primitives ---
import type { ButtonProps } from '@/components/tiptap-ui-primitive/button';
import { Button } from '@/components/tiptap-ui-primitive/button';

// --- Icons ---
import { HeadingIcon } from '@/components/tiptap-icons/heading-icon';
import { ChevronDownIcon } from '@/components/tiptap-icons/chevron-down-icon';

// --- Styles ---
import './font-size-dropdown-menu.scss';

export interface FontSizeOption {
  label: string;
  value: string;
}

export const FONT_SIZE_OPTIONS: FontSizeOption[] = [
  { label: '작게', value: '12px' },
  { label: '보통', value: '14px' },
  { label: '크게', value: '16px' },
  { label: '매우 크게', value: '18px' },
  { label: '특대', value: '20px' },
];

export interface FontSizeDropdownMenuProps extends Omit<ButtonProps, 'type'> {
  /**
   * The Tiptap editor instance.
   */
  editor?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  /**
   * Optional font size options to use in the dropdown.
   * If not provided, defaults to predefined font sizes.
   */
  options?: FontSizeOption[];
  /**
   * Whether the button should hide when the mark is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean;
  /**
   * Called when a font size is applied.
   */
  onApplied?: ({ size, label }: { size: string; label: string }) => void;
}

export function FontSizeDropdownMenu({
  editor: providedEditor,
  options = FONT_SIZE_OPTIONS,
  hideWhenUnavailable = false,
  onApplied,
  ...props
}: FontSizeDropdownMenuProps) {
  const { editor } = useTiptapEditor(providedEditor);
  const [isOpen, setIsOpen] = React.useState(false);

  // 현재 선택된 폰트 사이즈 찾기
  const getCurrentFontSize = () => {
    if (!editor) return null;

    // TextStyle 마크의 fontSize 속성 확인
    const attributes = editor.getAttributes('textStyle');
    return attributes.fontSize || null;
  };

  const currentFontSize = getCurrentFontSize();
  const currentOption = options.find((option) => option.value === currentFontSize);

  const isVisible = editor?.isEditable && options.length > 0;

  if (!isVisible && hideWhenUnavailable) {
    return null;
  }

  return (
    <DropdownMenuPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuPrimitive.Trigger asChild>
        <Button
          type="button"
          data-style="ghost"
          data-active-state={currentFontSize ? 'on' : 'off'}
          aria-label="Font size"
          tooltip="Font size"
          {...props}
        >
          <span className="tiptap-button-font-size">{currentOption?.label || '보통'}</span>
          <HeadingIcon className="tiptap-button-icon" />
          <ChevronDownIcon className="tiptap-button-icon" />
        </Button>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          className="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          sideOffset={5}
        >
          {options.map((option) => (
            <DropdownMenuPrimitive.Item
              key={option.value}
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              onClick={() => {
                if (editor) {
                  editor.chain().focus().setMark('textStyle', { fontSize: option.value }).run();
                  onApplied?.({ size: option.value, label: option.label });
                }
                setIsOpen(false);
              }}
            >
              <span className="font-size-option">
                {option.label} ({option.value})
              </span>
            </DropdownMenuPrimitive.Item>
          ))}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

export default FontSizeDropdownMenu;
