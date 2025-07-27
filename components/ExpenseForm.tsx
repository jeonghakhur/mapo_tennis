'use client';
import { useState, useCallback, useMemo } from 'react';
import { Box, Text, Button, TextField, Select, Flex } from '@radix-ui/themes';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Save } from 'lucide-react';
import { categoryOptions, extractAmountFromText } from '@/lib/expenseUtils';

interface ExpenseFormData {
  title: string;
  storeName: string;
  address: string;
  amount: string;
  category: string;
  date: string;
  description: string;
}

interface ExpenseFormProps {
  title?: string;
  subtitle?: string;
  submitButtonText?: string;
  initialData?: Partial<ExpenseFormData>;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  showImageUpload?: boolean;
}

export default function ExpenseForm({
  submitButtonText = '저장',
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  showImageUpload = true,
}: ExpenseFormProps) {
  const [form, setForm] = useState<ExpenseFormData>({
    title: '',
    storeName: '',
    address: '',
    amount: '',
    category: '',
    date: '',
    description: '',
    ...initialData,
  });

  const [receiptImage, setReceiptImage] = useState<File | undefined>(undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState('');

  // 드래그 앤 드롭 설정
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      const file = acceptedFiles[0];
      setReceiptImage(file);
      setPreview(URL.createObjectURL(file));
      setOcrLoading(true);

      // GPT Vision 분석 시작
      analyzeImage(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  // GPT Vision 처리 및 자동입력
  const analyzeImage = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/expenses/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('이미지 분석에 실패했습니다.');
      }

      const result = await response.json();
      const parsed = result.data;

      setForm((f) => ({
        ...f,
        title: f.title || '영수증 지출',
        storeName: parsed.store || '',
        address: parsed.address || '',
        amount: parsed.amount ? String(parsed.amount) : '',
        date: parsed.date || '',
        category: parsed.category || 'court_rental',
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : '이미지 분석에 실패했습니다.');
    } finally {
      setOcrLoading(false);
    }
  };

  // 입력값 변경
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;

      // 금액 필드인 경우 원화 기호 및 달러 처리
      if (name === 'amount') {
        const extractedAmount = extractAmountFromText(value);
        if (extractedAmount !== null) {
          // 달러로 입력된 경우 사용자에게 알림
          if (value.includes('$') || value.includes('USD')) {
            alert(`달러가 원화로 변환되었습니다: ${value} → ${extractedAmount.toLocaleString()}원`);
          }
          setForm((f) => ({ ...f, [name]: String(extractedAmount) }));
        } else {
          setForm((f) => ({ ...f, [name]: value }));
        }
      } else {
        setForm((f) => ({ ...f, [name]: value }));
      }
    },
    [],
  );

  // 카테고리 변경
  const handleCategoryChange = useCallback((value: string) => {
    setForm((f) => ({ ...f, category: value }));
  }, []);

  // 이미지 삭제
  const handleImageDelete = useCallback(() => {
    setReceiptImage(undefined);
    setPreview(null);
    setForm((f) => ({
      ...f,
      title: '',
      storeName: '',
      address: '',
      amount: '',
      category: '',
      date: '',
      description: '',
    }));
  }, []);

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.amount || !form.category || form.category === '' || !form.date) {
      setError('필수 항목을 입력하세요.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('storeName', form.storeName);
      formData.append('address', form.address);
      formData.append('amount', form.amount);
      formData.append('category', form.category);
      formData.append('date', form.date);
      formData.append('description', form.description);

      if (receiptImage) {
        formData.append('receiptImage', receiptImage);
      }

      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류 발생');
    }
  };

  // 이미지 미리보기 스타일
  const imagePreviewStyle = useMemo(
    () => ({
      borderRadius: 8,
      objectFit: 'cover' as const,
      border: '1px solid #ddd',
    }),
    [],
  );

  // 이미지 삭제 버튼 스타일
  const deleteButtonStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      top: 4,
      right: 4,
      background: 'rgba(0,0,0,0.5)',
      color: '#fff',
      border: 'none',
      borderRadius: '50%',
      width: 24,
      height: 24,
      cursor: 'pointer',
      fontWeight: 'bold' as const,
      fontSize: 16,
      lineHeight: '24px',
      textAlign: 'center' as const,
      padding: 0,
    }),
    [],
  );

  // 드롭존 스타일
  const dropzoneStyle = useMemo(
    () => ({
      border: '2px dashed #aaa',
      borderRadius: 8,
      padding: 16,
      textAlign: 'center' as const,
      marginBottom: 16,
      cursor: 'pointer',
      background: isDragActive ? '#f0f0f0' : '#fafafa',
    }),
    [isDragActive],
  );

  return (
    <Box>
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* 영수증 이미지 업로드 섹션 */}
        {showImageUpload && (
          <div>
            <Text weight="bold" size="3" mb="2" as="div">
              영수증 사진
            </Text>
            {preview ? (
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                <Image
                  src={preview}
                  alt="영수증 미리보기"
                  width={300}
                  height={200}
                  style={imagePreviewStyle}
                />
                <button
                  type="button"
                  onClick={handleImageDelete}
                  style={deleteButtonStyle}
                  aria-label="이미지 삭제"
                >
                  ×
                </button>
              </div>
            ) : (
              <div {...getRootProps()} style={dropzoneStyle}>
                <input {...getInputProps()} />
                <Text size="2" color="gray">
                  {isDragActive
                    ? '여기로 영수증 이미지를 드래그하세요...'
                    : '클릭 또는 드래그로 영수증 이미지를 첨부하세요'}
                </Text>
              </div>
            )}
            {ocrLoading && <Text color="gray">GPT Vision 분석 중...</Text>}
          </div>
        )}

        {/* 기본 정보 테이블 */}
        <div className="table-form">
          <table>
            <tbody>
              <tr>
                <th style={{ width: '100px' }}>제목 *</th>
                <td>
                  <TextField.Root
                    size="3"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="지출 제목을 입력하세요"
                    required
                  />
                </td>
              </tr>
              <tr>
                <th>금액 *</th>
                <td>
                  <TextField.Root
                    size="3"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="예: 15,000원, 15000, $15, $15.50"
                    min="0"
                    required
                  />
                </td>
              </tr>
              <tr>
                <th>카테고리 *</th>
                <td>
                  <Select.Root size="3" value={form.category} onValueChange={handleCategoryChange}>
                    <Select.Trigger placeholder="카테고리 선택" />
                    <Select.Content>
                      {categoryOptions.map((opt) => (
                        <Select.Item key={opt.value} value={opt.value}>
                          {opt.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </td>
              </tr>
              <tr>
                <th>지출일 *</th>
                <td>
                  <TextField.Root
                    size="3"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    type="date"
                    required
                  />
                </td>
              </tr>
              <tr>
                <th>매장명</th>
                <td>
                  <TextField.Root
                    size="3"
                    name="storeName"
                    value={form.storeName}
                    onChange={handleChange}
                    placeholder="매장명을 입력하세요"
                  />
                </td>
              </tr>
              <tr>
                <th>주소</th>
                <td>
                  <TextField.Root
                    size="3"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="주소를 입력하세요"
                  />
                </td>
              </tr>
              <tr>
                <th>설명</th>
                <td>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border rounded p-2"
                    placeholder="지출에 대한 추가 설명을 입력하세요"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <Box className="p-4 border-red-200 bg-red-50 rounded">
            <Text color="red">{error}</Text>
          </Box>
        )}

        {/* 버튼 */}
        <Flex gap="3" justify="end" className="btn-wrap">
          {onCancel && (
            <Button type="button" variant="soft" onClick={onCancel} size="3">
              취소
            </Button>
          )}
          <Button type="submit" disabled={loading || ocrLoading} size="3">
            <Save size="16" />
            {loading ? '저장 중...' : submitButtonText}
          </Button>
        </Flex>
      </form>
    </Box>
  );
}
