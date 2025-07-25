import { useForm, Controller } from 'react-hook-form';
import { Box, Text, Button, TextField } from '@radix-ui/themes';
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
}

export default function QuestionForm({ onSubmit, isSubmitting }: QuestionFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
    watch,
  } = useForm<QuestionFormValues>({
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box>
        <Text as="label" size="1" weight="bold" htmlFor="title">
          제목
        </Text>
        <TextField.Root
          id="title"
          size="3"
          placeholder="제목을 입력하세요"
          {...register('title', { required: '제목을 입력해 주세요.' })}
          mb="3"
        />
        {errors.title && (
          <Text size="1" color="red">
            {errors.title.message}
          </Text>
        )}

        <Text as="label" size="1" weight="bold" htmlFor="content">
          내용
        </Text>
        <Controller
          name="content"
          control={control}
          rules={{ required: '내용을 입력해 주세요.' }}
          render={({ field }) => (
            <SimpleEditor
              value={field.value}
              onChange={field.onChange}
              minHeight="200px"
              maxHeight="400px"
            />
          )}
        />
        {errors.content && (
          <Text size="1" color="red">
            {errors.content.message}
          </Text>
        )}

        <Box mt="4">
          <FileUpload attachments={attachments} onAttachmentsChange={handleAttachmentsChange} />
        </Box>

        <Button type="submit" size="3" mt="4" disabled={isSubmitting}>
          {isSubmitting ? '등록 중...' : '문의 등록'}
        </Button>
      </Box>
    </form>
  );
}
