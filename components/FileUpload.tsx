'use client';
import { useState, useRef } from 'react';
import { Box, Text, Button } from '@radix-ui/themes';
import { Upload, X, File, Image, FileText } from 'lucide-react';
import { uploadToSanityAssets } from '@/lib/sanityAssets';
import type { Attachment } from '@/model/post';

interface FileUploadProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
}

export default function FileUpload({ attachments, onAttachmentsChange }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);

    try {
      // Sanity Assets로 업로드
      const asset = await uploadToSanityAssets(file);

      const newAttachment: Attachment = {
        filename: asset.originalFilename,
        url: asset.url,
        size: asset.size,
        type: asset.mimeType,
      };

      onAttachmentsChange([...attachments, newAttachment]);
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(newAttachments);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      // eslint-disable-next-line jsx-a11y/alt-text
      return <Image size={16} />;
    } else if (type === 'application/pdf') {
      return <FileText size={16} />;
    } else {
      return <File size={16} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.hwp,.hwpx"
      />

      <Button
        type="button"
        variant="soft"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
        disabled={isUploading}
        mb="3"
        size="3"
      >
        <Upload size={16} />
        {isUploading ? '업로드 중...' : '파일 선택'}
      </Button>

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
            >
              <div className="flex items-center gap-2">
                {getFileIcon(attachment.type)}
                <div>
                  <Text size="2" weight="bold">
                    {attachment.filename}
                  </Text>
                  <Text size="1" color="gray" ml="2">
                    {formatFileSize(attachment.size)}
                  </Text>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="1"
                  variant="soft"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(attachment.url, '_blank');
                  }}
                >
                  보기
                </Button>
                <Button
                  type="button"
                  size="1"
                  variant="soft"
                  color="red"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveAttachment(index);
                  }}
                >
                  <X size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Box>
  );
}
