'use client';
import { useState, useCallback } from 'react';
import { Box, Text, Button, TextField, Select, Flex } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { categoryOptions, generateExpenseTitle, extractAmountFromText } from '@/lib/expenseUtils';

export default function CreateExpensePage() {
  const [form, setForm] = useState({
    title: '',
    storeName: '',
    address: '',
    amount: '',
    category: '',
    date: '',
    description: '',
    receiptImage: undefined as File | undefined,
    preview: null as string | null,
    ocrLoading: false,
    ocrText: '',
    customPrompt: '',
  });
  const [error, setError] = useState('');
  const router = useRouter();

  // 드래그 앤 드롭 설정
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      const file = acceptedFiles[0];
      setForm((f) => ({
        ...f,
        receiptImage: file,
        preview: URL.createObjectURL(file),
        ocrLoading: true,
        ocrText: '',
      }));

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
  const analyzeImage = async (file: File, prompt?: string) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (prompt) {
        formData.append('prompt', prompt);
      }

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
        ocrText: JSON.stringify(parsed, null, 2),
        title: generateExpenseTitle(),
        storeName: parsed.store || '',
        address: parsed.address || '',
        amount: parsed.amount ? String(parsed.amount) : '',
        date: parsed.date || '',
        category: parsed.category || 'court_rental', // AI가 추천한 카테고리 사용
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : '이미지 분석에 실패했습니다.');
    } finally {
      setForm((f) => ({ ...f, ocrLoading: false }));
    }
  };

  // 사용자 정의 프롬프트로 재분석
  const handleReanalyze = async () => {
    if (!form.receiptImage) return;

    setForm((f) => ({ ...f, ocrLoading: true }));
    await analyzeImage(form.receiptImage, form.customPrompt);
  };

  // 입력값 변경
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
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
  };

  // 저장
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.amount || !form.category || form.category === '' || !form.date) {
      setError('필수 항목을 입력하세요.');
      return;
    }
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('storeName', form.storeName);
    fd.append('address', form.address);
    fd.append('amount', form.amount);
    fd.append('category', form.category);
    fd.append('date', form.date);
    fd.append('description', form.description);
    if (form.receiptImage) fd.append('receiptImage', form.receiptImage);
    // OCR 텍스트도 함께 전송(추후 활용 가능)
    if (form.ocrText) fd.append('extractedText', form.ocrText);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        body: fd,
      });
      if (res.ok) {
        alert('지출내역이 저장되었습니다.');
        router.push('/expenses');
      } else {
        const data = await res.json();
        setError(data.error || '저장 실패');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류 발생');
    }
  };

  return (
    <Box className="max-w-lg mx-auto mt-8 p-6 border rounded-lg bg-white">
      <Text size="6" weight="bold" mb="4">
        지출내역 등록
      </Text>

      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="3">
          <div>
            <Text weight="bold" mb="2">
              영수증 사진
            </Text>
            {form.preview ? (
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                <Image
                  src={form.preview}
                  alt="영수증 미리보기"
                  width={300}
                  height={200}
                  style={{
                    borderRadius: 8,
                    objectFit: 'cover',
                    border: '1px solid #ddd',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      receiptImage: undefined,
                      preview: null,
                      ocrText: '',
                      title: '',
                      storeName: '',
                      address: '',
                      amount: '',
                      category: '',
                      date: '',
                      description: '',
                      customPrompt: '',
                    }));
                  }}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: 16,
                    lineHeight: '24px',
                    textAlign: 'center',
                    padding: 0,
                  }}
                  aria-label="이미지 삭제"
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                style={{
                  border: '2px dashed #aaa',
                  borderRadius: 8,
                  padding: 16,
                  textAlign: 'center',
                  marginBottom: 16,
                  cursor: 'pointer',
                  background: isDragActive ? '#f0f0f0' : '#fafafa',
                }}
              >
                <input {...getInputProps()} />
                <Text size="2" color="gray">
                  {isDragActive
                    ? '여기로 영수증 이미지를 드래그하세요...'
                    : '클릭 또는 드래그로 영수증 이미지를 첨부하세요'}
                </Text>
              </div>
            )}
            {form.ocrLoading && <Text color="gray">GPT Vision 분석 중...</Text>}
          </div>
          <div>
            <Text weight="bold">제목 *</Text>
            <TextField.Root name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div>
            <Text weight="bold">매장명</Text>
            <TextField.Root name="storeName" value={form.storeName} onChange={handleChange} />
          </div>
          <div>
            <Text weight="bold">주소</Text>
            <TextField.Root name="address" value={form.address} onChange={handleChange} />
          </div>
          <div>
            <Text weight="bold">금액 *</Text>
            <TextField.Root
              name="amount"
              value={form.amount}
              onChange={handleChange}
              required
              placeholder="예: 15,000원, 15000, $15, $15.50"
              min="0"
            />
          </div>
          <div>
            <Text weight="bold">카테고리 *</Text>
            <Select.Root
              value={form.category}
              onValueChange={(v: string) => setForm((f) => ({ ...f, category: v }))}
            >
              <Select.Trigger placeholder="카테고리 선택" />
              <Select.Content>
                {categoryOptions.map((opt) => (
                  <Select.Item key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </div>
          <div>
            <Text weight="bold">지출일 *</Text>
            <TextField.Root
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              type="date"
            />
          </div>
          <label>
            <Text weight="bold">설명</Text>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              className="w-full border rounded p-2"
            />
          </label>
          {form.ocrText && (
            <Box className="bg-gray-50 p-2 rounded text-xs text-gray-500">
              <Text weight="bold">GPT Vision 분석 결과</Text>
              <pre>{form.ocrText}</pre>
            </Box>
          )}

          {form.preview && (
            <div>
              <Text weight="bold" mb="2">
                사용자 정의 프롬프트로 재분석
              </Text>
              <TextField.Root
                placeholder="예: 이 영수증에서 세금 정보만 추출해주세요. JSON 형식으로 응답해주세요."
                value={form.customPrompt}
                onChange={(e) => setForm((f) => ({ ...f, customPrompt: e.target.value }))}
                mb="2"
              />
              <Button
                type="button"
                size="2"
                variant="soft"
                onClick={handleReanalyze}
                disabled={form.ocrLoading || !form.customPrompt.trim()}
              >
                {form.ocrLoading ? '재분석 중...' : '재분석'}
              </Button>
            </div>
          )}
          {error && <Text color="red">{error}</Text>}
          <Button type="submit" size="3" disabled={form.ocrLoading}>
            저장
          </Button>
        </Flex>
      </form>
    </Box>
  );
}
