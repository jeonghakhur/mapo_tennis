'use client';
import { AlertDialog, Button, Flex } from '@radix-ui/themes';
import { useState } from 'react';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'solid' | 'soft' | 'outline' | 'ghost';
  confirmColor?: 'red' | 'blue' | 'green' | 'gray';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ConfirmDialog({
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  confirmVariant = 'solid',
  confirmColor,
  onConfirm,
  onCancel,
  trigger,
  disabled = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ConfirmDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 제어된 상태와 비제어 상태 처리
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : isOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange : setIsOpen;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange?.(false);
    } catch (error) {
      console.error('확인 작업 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange?.(false);
    onCancel?.();
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialog.Trigger disabled={disabled}>{trigger}</AlertDialog.Trigger>}
      <AlertDialog.Content>
        <AlertDialog.Title>{title}</AlertDialog.Title>
        <AlertDialog.Description>{description}</AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel onClick={handleCancel}>
            <Button variant="soft" color="gray" disabled={isLoading}>
              {cancelText}
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button
              variant={confirmVariant}
              color={confirmColor || 'red'}
              disabled={isLoading}
              onClick={handleConfirm}
            >
              {isLoading ? '처리 중...' : confirmText}
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
