// 문의 상세 모달 스타일.
// 대기중(TAPending)과 처리완료(TACompleted)가 같은 구조를 쓰되,
// 화면별 정체성 색(대기=주황, 완료=초록)만 accent로 갈아끼운다.
export const NAVY = '#003675';

const LINE = '#e5e8ec';
const GRAY = '#5b6572';
const INK = '#1a1d21';

// 화면별 팔레트. grad는 헤더 그라데이션의 3단계(밝음 → 중간 → 어두움),
// chipText는 흰 칩 위에 올라갈 글자색.
export const ACCENTS = {
  pending: {
    accent: '#ff9800',
    grad: ['#ffa726', '#ef6c00', '#8d3b00'],
    chipText: '#8d3b00',
  },
  completed: {
    accent: '#2e7d32',
    grad: ['#4caf50', '#2e7d32', '#14421a'],
    chipText: '#14421a',
  },
  // 공지사항·FAQ 관리 화면용. 문의와 달리 상태 구분이 없어 기본 남색 계열을 쓴다.
  navy: {
    accent: NAVY,
    grad: ['#4d8fd6', NAVY, '#001b3d'],
    chipText: '#001b3d',
  },
};

export function makeInquiryModalStyles(theme) {
  const accent = theme.accent;
  const [g1, g2, g3] = theme.grad;
  return {
    overlay: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
      WebkitBackdropFilter: 'blur(3px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100,
    },
    modal: {
      width: 'min(94%, 620px)', maxHeight: '85%', backgroundColor: '#fff',
      borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
    },

    // 헤더 — 화면 색(대기=주황, 완료=초록)을 헤더 전체가 입는다.
    // 광택은 backdrop-filter로 뒤를 비추는 대신 직접 그린다. 뒤에 흐릴 무늬가 없으면
    // blur는 아무 효과가 없고, 애니메이션 중인 조상 안에서는 바깥을 읽지도 못하기 때문.
    // 첫 번째 레이어가 대각선 빛 반사, 두 번째가 바탕 그라데이션.
    header: {
      position: 'relative',
      overflow: 'hidden',
      color: '#fff',
      padding: 'clamp(16px, 4vw, 20px) clamp(16px, 4.5vw, 22px)',
      flexShrink: 0,
      // 225deg = 밝은 색이 오른쪽 위, 어두운 색이 왼쪽 아래.
      // 빛 반사도 같은 쪽에서 들어오도록 좌우를 뒤집었다(118 -> 242).
      backgroundImage: [
        'linear-gradient(242deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.10) 22%, rgba(255,255,255,0) 42%)',
        `linear-gradient(225deg, ${g1} 0%, ${g2} 42%, ${g3} 100%)`,
      ].join(', '),
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45)',
    },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
    kicker: {
      fontSize: '11px', letterSpacing: '0.14em', opacity: 0.7,
      fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase',
    },
    headerTitle: { margin: 0, fontSize: 'clamp(17px, 4.4vw, 19px)', fontWeight: 800, lineHeight: 1.35, wordBreak: 'keep-all' },
    closeBtn: {
      background: 'rgba(255,255,255,0.14)', border: 'none', color: '#fff',
      width: '30px', height: '30px', borderRadius: '9px', cursor: 'pointer',
      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    metaRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '13px' },
    // 칩은 헤더 색 위에 얹히므로 반투명 흰색 + 테두리 하이라이트로 떠 보이게 한다
    chip: {
      fontSize: '11.5px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px',
      backgroundColor: 'rgba(255,255,255,0.17)',
      border: '1px solid rgba(255,255,255,0.26)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.24)',
      color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '4px',
    },
    // 가장 중요한 정보(마감·상태)는 흰 칩으로 반전시켜 확실히 눈에 띄게
    chipAccent: {
      fontSize: '11.5px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px',
      backgroundColor: 'rgba(255,255,255,0.94)',
      border: '1px solid #fff',
      color: theme.chipText, display: 'inline-flex', alignItems: 'center', gap: '4px',
    },

    content: { padding: 'clamp(16px, 4.5vw, 22px)', overflowY: 'auto', flex: 1, backgroundColor: '#fff' },

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
    bubbleWrapLeft: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
    bubbleWrapRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
    who: { fontSize: '10.5px', fontWeight: 800, color: '#9aa3af', marginBottom: '5px' },
    bubbleMuted: {
      maxWidth: '84%', padding: '12px 15px', borderRadius: '14px', borderBottomLeftRadius: '4px',
      backgroundColor: '#f1f3f6', color: INK, fontSize: '14px', lineHeight: 1.65, whiteSpace: 'pre-wrap',
    },
    // 조교 말풍선·주요 버튼은 화면 색을 따른다. g1은 흰 글자를 올리기엔 밝아서 중간 단계(g2)를 쓴다.
    bubbleAccent: {
      maxWidth: '84%', padding: '12px 15px', borderRadius: '14px', borderBottomRightRadius: '4px',
      backgroundColor: g2, color: '#fff', fontSize: '14px', lineHeight: 1.65, whiteSpace: 'pre-wrap',
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
    // 좁은 화면(모바일 학생 화면)에서 첨부 버튼과 등록 버튼이 한 줄에 안 들어가면
    // 등록 버튼 글자가 잘리므로, 눌리는 대신 줄을 바꾸도록 한다.
    footRow: { display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginTop: '12px' },
    attachBtn: {
      display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '11px 15px',
      border: '1px dashed #c6ccd5', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
      color: GRAY, cursor: 'pointer', backgroundColor: '#fff', whiteSpace: 'nowrap',
      flexShrink: 0,
    },
    attachBtnActive: {
      display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '11px 15px',
      border: `1px solid ${accent}`, borderRadius: '10px', fontSize: '13px', fontWeight: 700,
      color: accent, cursor: 'pointer', backgroundColor: '#fff', whiteSpace: 'nowrap',
      maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0,
    },
    submitBtn: {
      flex: 1, minWidth: '140px', padding: '13px', backgroundColor: g2, color: '#fff',
      border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 800, cursor: 'pointer',
    },

    // 답변 수정(완료 화면)
    editTextarea: {
      width: '100%', minHeight: '100px', padding: '12px', borderRadius: '10px',
      border: `1px solid ${LINE}`, boxSizing: 'border-box', fontSize: '14px',
      lineHeight: 1.7, fontFamily: 'inherit', resize: 'none', outline: 'none',
    },
    editActions: { marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '8px' },
    // 답변 수정 저장도 '답변 등록'과 같은 성격의 동작이라 같은 색을 쓴다
    saveBtn: {
      padding: '8px 16px', backgroundColor: g2, color: '#fff', border: 'none',
      borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '13px',
    },
    cancelBtn: {
      padding: '8px 16px', backgroundColor: '#eef0f3', color: GRAY, border: 'none',
      borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '13px',
    },

    emptyThread: { fontSize: '13px', color: '#9aa3af', padding: '4px 0' },
  };
}
