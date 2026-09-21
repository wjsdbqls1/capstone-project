// 첨부파일 관련 공용 값.
//
// ★ ACCEPT_ATTACHMENT는 backend/upload_utils.py의 ALLOWED_EXTS와 같아야 한다.
//   한쪽만 고치면 파일 선택 창에서는 고를 수 있는데 등록할 때 거부당한다.
export const ACCEPT_ATTACHMENT =
  '.jpg,.jpeg,.png,.gif,.webp,.bmp,.heic,.pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip';

// 한 번에 올릴 수 있는 개수. backend/upload_utils.py의 MAX_FILES와 같아야 한다.
export const MAX_FILES = 5;

/**
 * 서버가 준 첨부 목록을 [{ url(절대 주소), name }] 로 정리한다.
 *
 * 새 서버는 attachments 목록을 내려주지만, 옛 응답(앱 캐시 등)은 단일 컬럼만 있을 수 있어
 * 그 경우도 한 개짜리 목록으로 바꿔 화면이 한 가지 형태만 다루게 한다.
 * kind: 'inquiry' | 'notice' | 'external' | 'faq'  — 옛 단일 컬럼의 경로 규칙이 서로 다르다
 */
export function attachmentsOf(obj, kind, base) {
  if (!obj) return [];
  const abs = (u) => (u && !/^https?:/.test(u) ? `${base}${u}` : u);
  if (Array.isArray(obj.attachments) && obj.attachments.length) {
    return obj.attachments
      .filter((a) => a && a.url)
      .map((a) => ({ url: abs(a.url), name: a.name || a.url.split('/').pop() }));
  }
  if (kind === 'inquiry' && obj.attachment) {
    return [{ url: abs(obj.attachment), name: obj.attachment.split('/').pop() }];
  }
  if ((kind === 'notice' || kind === 'external' || kind === 'faq') && obj.file_path) {
    const folder = kind === 'faq' ? 'faqs' : kind === 'external' ? 'external_notices' : 'notices';
    return [{ url: abs(`/uploads/${folder}/${obj.file_path}`), name: obj.original_filename || obj.file_path }];
  }
  return [];
}

/** FormData에 고른 파일들을 서버가 받는 이름(files)으로 넣는다 */
export function appendFiles(formData, files) {
  (files || []).forEach((f) => formData.append('files', f));
}

/**
 * 서버가 돌려준 거절 사유를 꺼낸다.
 * 확장자 제한(400)·용량 초과(413)·삭제 차단(409)은 서버가 이유를 문장으로 주는데,
 * 그걸 버리고 "실패했습니다"만 띄우면 사용자가 원인을 알 수 없다.
 */
export function errorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;
  // 422(유효성 오류)의 detail은 배열이라 그대로 보여주면 읽을 수 없다
  if (typeof detail === 'string' && detail.trim()) return detail;
  return fallback;
}
