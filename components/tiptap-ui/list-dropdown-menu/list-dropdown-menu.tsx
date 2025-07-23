'use client';

import * as React from 'react';
import { type Editor } from '@tiptap/react';

// --- Hooks ---
import { useTiptapEditor } from '@/hooks/use-tiptap-editor';

// --- Icons ---
import { ChevronDownIcon } from '@/components/tiptap-icons/chevron-down-icon';

// --- Tiptap UI ---
import { ListButton, type ListType } from '@/components/tiptap-ui/list-button';

import { useListDropdownMenu } from './use-list-dropdown-menu';

// --- UI Primitives ---
import type { ButtonProps } from '@/components/tiptap-ui-primitive/button';
import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Card, CardBody } from '@/components/tiptap-ui-primitive/card';

export interface ListDropdownMenuProps extends Omit<ButtonProps, 'type'> {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor;
  /**
   * The list types to display in the dropdown.
   */
  types?: ListType[];
  /**
   * Whether the dropdown should be hidden when no list types are available
   * @default false
   */
  hideWhenUnavailable?: boolean;
}

export function ListDropdownMenu({
  editor: providedEditor,
  types = ['bulletList', 'orderedList', 'taskList'],
  hideWhenUnavailable = false,
  ...props
}: ListDropdownMenuProps) {
  const { editor } = useTiptapEditor(providedEditor);
  const [isOpen, setIsOpen] = React.useState(false);

  const { filteredLists, canToggle, isActive, isVisible, Icon } = useListDropdownMenu({
    editor,
    types,
    hideWhenUnavailable,
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  if (!isVisible || !editor || !editor.isEditable) {
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
          aria-label="List options"
          tooltip="List"
          {...props}
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
                {filteredLists.map((option) => (
                  <DropdownMenuPrimitive.Item key={option.type} asChild>
                    <ListButton
                      editor={editor}
                      type={option.type}
                      text={option.label}
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
}

export default ListDropdownMenu;
