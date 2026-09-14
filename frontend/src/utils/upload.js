// 첨부파일 관련 공용 값.
//
// ★ ACCEPT_ATTACHMENT는 backend/upload_utils.py의 ALLOWED_EXTS와 같아야 한다.
//   한쪽만 고치면 파일 선택 창에서는 고를 수 있는데 등록할 때 거부당한다.
export const ACCEPT_ATTACHMENT =
  '.jpg,.jpeg,.png,.gif,.webp,.bmp,.heic,.pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.zip';

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
