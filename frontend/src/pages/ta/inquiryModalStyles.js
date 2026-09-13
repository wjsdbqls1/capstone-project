// 문의 상세 모달 스타일.
// 대기중(TAPending)과 처리완료(TACompleted)가 같은 구조를 쓰되,
// 화면별 정체성 색(대기=주황, 완료=초록)만 accent로 갈아끼운다.
export const NAVY = '#003675';

const LINE = '#e5e8ec';
const GRAY = '#5b6572';
const INK = '#1a1d21';

// '#ff9800' -> 'rgba(255,152,0,0.3)'. 헤더 광원과 칩 배경에 강조색을 옅게 깔기 위함.
function rgba(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function makeInquiryModalStyles(accent) {
  return {
    // 헤더가 유리처럼 보이려면 뒤에 비칠 것이 있어야 한다.
    // 오버레이를 너무 어둡게 덮으면 배경 이미지가 죽어 블러가 무의미해지므로 살짝 걷어냈다.
    overlay: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
      WebkitBackdropFilter: 'blur(2px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100,
    },
    // 모달 자체는 투명. 흰 배경은 본문(content)이 깔기 때문에,
    // 이렇게 해야 헤더의 backdrop-filter가 '모달의 흰색'이 아니라 '뒤 화면'을 흐린다.
    modal: {
      width: '90%', maxWidth: '620px', maxHeight: '85%', backgroundColor: 'transparent',
      borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
    },

    // 헤더 — 반투명 남색 위에 blur를 걸어 뒤 화면이 뿌옇게 비치게 한다(진짜 유리).
    // 여기에 대각 sheen(빛 반사)과 위쪽 1px 하이라이트를 얹어 표면감을 준다.
    header: {
      position: 'relative',
      overflow: 'hidden',
      color: '#fff',
      padding: '20px 22px',
      flexShrink: 0,
      backgroundColor: 'rgba(0, 38, 84, 0.72)',
      backgroundImage: [
        'linear-gradient(125deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 32%, rgba(255,255,255,0) 56%)',
        `radial-gradient(520px 210px at 106% 135%, ${rgba(accent, 0.45)}, transparent 62%)`,
      ].join(', '),
      backdropFilter: 'blur(22px) saturate(150%)',
      WebkitBackdropFilter: 'blur(22px) saturate(150%)',
      borderBottom: '1px solid rgba(255,255,255,0.14)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.24)',
    },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
    kicker: {
      fontSize: '11px', letterSpacing: '0.14em', opacity: 0.7,
      fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase',
    },
    headerTitle: { margin: 0, fontSize: '19px', fontWeight: 800, lineHeight: 1.35, wordBreak: 'keep-all' },
    closeBtn: {
      background: 'rgba(255,255,255,0.14)', border: 'none', color: '#fff',
      width: '30px', height: '30px', borderRadius: '9px', cursor: 'pointer',
      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    metaRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '13px' },
    // 칩도 테두리 하이라이트를 줘야 유리 조각처럼 읽힌다(블러만으로는 티가 안 남)
    chip: {
      fontSize: '11.5px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px',
      backgroundColor: 'rgba(255,255,255,0.16)',
      border: '1px solid rgba(255,255,255,0.24)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22)',
      color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '4px',
    },
    chipAccent: {
      fontSize: '11.5px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px',
      backgroundColor: rgba(accent, 0.88),
      border: `1px solid ${rgba(accent, 1)}`,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
      color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '4px',
    },

    content: { padding: '22px', overflowY: 'auto', flex: 1, backgroundColor: '#fff' },

    // 섹션 라벨 + 가로선으로 위계 만들기
    section: { marginBottom: '22px' },
    sectionLast: { marginBottom: 0 },
    sectionHead: {
      display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 800,
      color: GRAY, letterSpacing: '0.1em', marginBottom: '9px', textTransform: 'uppercase',
    },
    sectionLine: { flex: 1, height: '1px', backgroundColor: LINE },

    qText: { fontSize: '15px', lineHeight: 1.75, color: INK, whiteSpace: 'pre-wrap' },
    fileLink: {
      display: 'inline-flex', alignItems: 'center', gap: '7px', marginTop: '13px',
      padding: '8px 13px', border: `1px solid ${LINE}`, borderRadius: '9px',
      fontSize: '13px', fontWeight: 700, color: NAVY, textDecoration: 'none', backgroundColor: '#fff',
    },

    // 대화 — 색이 아니라 좌우 위치로도 구분되게
    thread: { display: 'flex', flexDirection: 'column', gap: '12px' },
    bubbleWrapStudent: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
    bubbleWrapTA: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
    who: { fontSize: '10.5px', fontWeight: 800, color: '#9aa3af', marginBottom: '5px' },
    bubbleStudent: {
      maxWidth: '84%', padding: '12px 15px', borderRadius: '14px', borderBottomLeftRadius: '4px',
      backgroundColor: '#f1f3f6', color: INK, fontSize: '14px', lineHeight: 1.65, whiteSpace: 'pre-wrap',
    },
    bubbleTA: {
      maxWidth: '84%', padding: '12px 15px', borderRadius: '14px', borderBottomRightRadius: '4px',
      backgroundColor: NAVY, color: '#fff', fontSize: '14px', lineHeight: 1.65, whiteSpace: 'pre-wrap',
    },
    bubbleFile: {
      display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px',
      fontSize: '12px', fontWeight: 700, textDecoration: 'underline',
    },
    editBtn: {
      marginTop: '6px', fontSize: '11.5px', border: 'none', background: 'none', color: '#9aa3af',
      cursor: 'pointer', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '3px',
    },

    // AI 추천
    aiCard: { border: `1px solid ${LINE}`, borderRadius: '12px', overflow: 'hidden' },
    aiHead: {
      display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 13px',
      backgroundColor: '#eef3f9', fontSize: '12.5px', fontWeight: 800, color: NAVY,
    },
    aiRow: { display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 13px', borderTop: `1px solid ${LINE}` },
    aiRank: {
      width: '19px', height: '19px', borderRadius: '6px', backgroundColor: NAVY, color: '#fff',
      fontSize: '10.5px', fontWeight: 800, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0, marginTop: '1px',
    },
    aiText: { flex: 1, fontSize: '13px', lineHeight: 1.65, color: GRAY },
    aiUseBtn: {
      flexShrink: 0, padding: '5px 12px', border: `1px solid ${NAVY}`, backgroundColor: '#fff',
      color: NAVY, borderRadius: '7px', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
    },

    // 답변 입력
    textarea: {
      width: '100%', minHeight: '130px', padding: '14px', border: `1px solid ${LINE}`,
      borderRadius: '11px', fontSize: '14.5px', lineHeight: 1.7, resize: 'none',
      boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
    },
    charCount: { fontSize: '11.5px', color: '#9aa3af', textAlign: 'right', marginTop: '6px' },
    footRow: { display: 'flex', gap: '10px', alignItems: 'center', marginTop: '12px' },
    attachBtn: {
      display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '11px 15px',
      border: '1px dashed #c6ccd5', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
      color: GRAY, cursor: 'pointer', backgroundColor: '#fff', whiteSpace: 'nowrap',
    },
    attachBtnActive: {
      display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '11px 15px',
      border: `1px solid ${accent}`, borderRadius: '10px', fontSize: '13px', fontWeight: 700,
      color: accent, cursor: 'pointer', backgroundColor: '#fff', whiteSpace: 'nowrap',
      maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis',
    },
    submitBtn: {
      flex: 1, padding: '13px', backgroundColor: NAVY, color: '#fff', border: 'none',
      borderRadius: '10px', fontSize: '15px', fontWeight: 800, cursor: 'pointer',
    },

    // 답변 수정(완료 화면)
    editTextarea: {
      width: '100%', minHeight: '100px', padding: '12px', borderRadius: '10px',
      border: `1px solid ${LINE}`, boxSizing: 'border-box', fontSize: '14px',
      lineHeight: 1.7, fontFamily: 'inherit', resize: 'none', outline: 'none',
    },
    editActions: { marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '8px' },
    saveBtn: {
      padding: '8px 16px', backgroundColor: NAVY, color: '#fff', border: 'none',
      borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '13px',
    },
    cancelBtn: {
      padding: '8px 16px', backgroundColor: '#eef0f3', color: GRAY, border: 'none',
      borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '13px',
    },

    emptyThread: { fontSize: '13px', color: '#9aa3af', padding: '4px 0' },
  };
}
