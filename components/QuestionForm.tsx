import { useForm, Controller } from 'react-hook-form';
import { Box, Button, TextField } from '@radix-ui/themes';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import FileUpload from '@/components/FileUpload';
import type { QuestionAttachment } from '@/model/question';

export interface QuestionFormValues {
  title: string;
  content: string;
  attachments: QuestionAttachment[];
}

interface QuestionFormProps {
  onSubmit: (data: QuestionFormValues) => Promise<void>;
  isSubmitting?: boolean;
  onError?: (errors: Record<string, { message?: string }>) => void;
}

export default function QuestionForm({ onSubmit, isSubmitting, onError }: QuestionFormProps) {
  const { register, handleSubmit, control, setValue, watch } = useForm<QuestionFormValues>({
    defaultValues: {
      title: '',
      content: '',
      attachments: [],
    },
  });

  const attachments = watch('attachments') || [];

  // 첨부파일 3MB 이하, 최대 3개 제한
  const handleAttachmentsChange = (files: QuestionAttachment[]) => {
    if (files.length > 3) {
      alert('첨부파일은 최대 3개까지 등록할 수 있습니다.');
      return;
    }
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 첨부할 수 있습니다.');
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        alert('각 첨부파일은 3MB 이하만 등록할 수 있습니다.');
        return;
      }
    }
    setValue('attachments', files);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
      <TextField.Root
        id="title"
        size="3"
        placeholder="제목을 입력하세요"
        {...register('title', { required: '제목을 입력해 주세요.' })}
        mb="3"
      />

      <Controller
        name="content"
        control={control}
        rules={{
          required: '내용을 입력해 주세요.',
          validate: (value) => {
            // HTML 태그 제거 후 공백만 남으면 에러
            const text = value.replace(/<[^>]*>/g, '').trim();
            return text.length > 0 || '내용을 입력해 주세요.';
          },
        }}
        render={({ field }) => (
          <SimpleEditor
            value={field.value}
            onChange={field.onChange}
            minHeight="200px"
            maxHeight="400px"
          />
        )}
      />

      <Box position="relative" mt="4">
        <FileUpload attachments={attachments} onAttachmentsChange={handleAttachmentsChange} />
        <Button
          type="submit"
          size="3"
          disabled={isSubmitting}
          style={{ position: 'absolute', top: 0, right: 0 }}
        >
          {isSubmitting ? '등록 중...' : '문의 등록'}
        </Button>
      </Box>
    </form>
  );
}
