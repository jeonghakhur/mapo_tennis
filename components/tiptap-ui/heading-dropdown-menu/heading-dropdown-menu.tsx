'use client';

import * as React from 'react';

// --- Icons ---
import { ChevronDownIcon } from '@/components/tiptap-icons/chevron-down-icon';

// --- Hooks ---
import { useTiptapEditor } from '@/hooks/use-tiptap-editor';

// --- Tiptap UI ---
import { HeadingButton } from '@/components/tiptap-ui/heading-button';
import type { UseHeadingDropdownMenuConfig } from '@/components/tiptap-ui/heading-dropdown-menu';
import { useHeadingDropdownMenu } from '@/components/tiptap-ui/heading-dropdown-menu';

// --- UI Primitives ---
import type { ButtonProps } from '@/components/tiptap-ui-primitive/button';
import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Card, CardBody } from '@/components/tiptap-ui-primitive/card';

export interface HeadingDropdownMenuProps
  extends Omit<ButtonProps, 'type'>,
    UseHeadingDropdownMenuConfig {}

/**
 * Dropdown menu component for selecting heading levels in a Tiptap editor.
 *
 * For custom dropdown implementations, use the `useHeadingDropdownMenu` hook instead.
 */
export const HeadingDropdownMenu = React.forwardRef<HTMLButtonElement, HeadingDropdownMenuProps>(
  (
    {
      editor: providedEditor,
      levels = [1, 2, 3, 4, 5, 6],
      hideWhenUnavailable = false,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor(providedEditor);
    const [isOpen, setIsOpen] = React.useState(false);
    const { isVisible, isActive, canToggle, Icon } = useHeadingDropdownMenu({
      editor,
      levels,
      hideWhenUnavailable,
    });

    const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
    };

    if (!isVisible) {
      return null;
    }

    return (
      <DropdownMenuPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuPrimitive.Trigger asChild>
          <Button
            type="button"
            data-style="ghost"
            data-active-state={isActive ? 'on' : 'off'}
            role="button"
            tabIndex={-1}
            disabled={!canToggle}
            data-disabled={!canToggle}
            aria-label="Format text as heading"
            aria-pressed={isActive}
            tooltip="Heading"
            {...buttonProps}
            ref={ref}
          >
            <Icon className="tiptap-button-icon" />
            <ChevronDownIcon className="tiptap-button-dropdown-small" />
          </Button>
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
            sideOffset={5}
          >
            <Card>
              <CardBody>
                <ButtonGroup>
                  {levels.map((level) => (
                    <DropdownMenuPrimitive.Item key={`heading-${level}`} asChild>
                      <HeadingButton
                        editor={editor}
                        level={level}
                        text={`Heading ${level}`}
                        showTooltip={false}
                      />
                    </DropdownMenuPrimitive.Item>
                  ))}
                </ButtonGroup>
              </CardBody>
            </Card>
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
    );
  },
);

HeadingDropdownMenu.displayName = 'HeadingDropdownMenu';

export default HeadingDropdownMenu;
