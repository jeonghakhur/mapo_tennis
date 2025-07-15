'use client';
import { Box, Text, Button } from '@radix-ui/themes';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { Image } from 'lucide-react';
import { useRef, useState } from 'react';
import { uploadImageToSanityAssets } from '@/lib/sanityAssets';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleImageUpload = async (file: File) => {
    try {
      // Sanity Assets로 이미지 업로드
      const asset = await uploadImageToSanityAssets(file);
      const imageMarkdown = `![${file.name}](${asset.url})`;

      // 현재 커서 위치에 이미지 마크다운 삽입
      const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.substring(0, start) + imageMarkdown + value.substring(end);
        onChange(newValue);

        // 커서 위치 조정
        setTimeout(() => {
          textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
          textarea.focus();
        }, 0);
      }
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];

      // 이미지 파일인지 확인
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
      }

      handleImageUpload(file);

      // 파일 입력 필드 초기화 (같은 파일을 다시 선택할 수 있도록)
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];

      // 이미지 파일인지 확인
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
      }

      handleImageUpload(file);
    }
  };

  return (
    <Box>
      <div className="flex items-center justify-between mb-2">
        <Text size="2" weight="bold">
          내용 *
        </Text>
        <Button
          type="button"
          variant="soft"
          size="2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          <Image size={14} />
          이미지 삽입
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept="image/*"
      />

      <div
        data-color-mode="light"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={isDragOver ? 'border-2 border-dashed border-blue-400 bg-blue-50' : ''}
      >
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || '')}
          height={400}
          preview="edit"
          hideToolbar={false}
          textareaProps={{
            placeholder:
              placeholder ||
              '포스트 내용을 마크다운으로 작성하세요...\n\n💡 이미지를 드래그 앤 드롭하거나 "이미지 삽입" 버튼을 클릭하세요.',
          }}
        />
      </div>

      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 z-10">
          <div className="text-center">
            <Image size={48} className="mx-auto text-blue-500 mb-2" />
            <Text size="3" weight="bold" color="blue">
              이미지를 여기에 놓으세요
            </Text>
          </div>
        </div>
      )}
    </Box>
  );
}
