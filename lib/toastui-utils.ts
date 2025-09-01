// Toast UI Editor CSS 로딩 관리
const loadedCSS = new Set<string>();

export function loadToastUICSS(cssUrl: string): void {
  if (loadedCSS.has(cssUrl)) {
    return; // 이미 로드된 CSS는 다시 로드하지 않음
  }

  // DOM에 이미 존재하는지 확인
  const existingLink = document.querySelector(`link[href="${cssUrl}"]`);
  if (existingLink) {
    loadedCSS.add(cssUrl);
    return;
  }

  // CSS 로드
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssUrl;
  document.head.appendChild(link);

  // 로드 완료 후 Set에 추가
  link.onload = () => {
    loadedCSS.add(cssUrl);
  };

  // 에러 처리
  link.onerror = () => {
    console.error(`Failed to load CSS: ${cssUrl}`);
  };
}

export function loadToastUIEditorCSS(): void {
  loadToastUICSS('https://uicdn.toast.com/editor/latest/toastui-editor.css');
}

export function loadToastUIViewerCSS(): void {
  loadToastUICSS('https://uicdn.toast.com/editor/latest/toastui-editor-viewer.css');
}
