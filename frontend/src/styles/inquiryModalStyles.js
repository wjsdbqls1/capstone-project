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

// maxWidth: 조교 화면은 넓은 모니터에서 보므로 더 크게 쓰고,
// 휴대폰으로 보는 학생 화면은 기본값(620px)을 유지한다.
// 어느 쪽이든 좁은 화면에서는 94%가 먼저 걸려 넘치지 않는다.
export function makeInquiryModalStyles(theme, { maxWidth = '620px' } = {}) {
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
      width: `min(94%, ${maxWidth})`,
      // 내용이 적으면 모달이 납작해져 보기 불편하므로 최소 높이를 준다.
      // 화면이 낮은 기기에서는 비율이 먼저 걸려 화면을 넘지 않는다.
      minHeight: 'min(780px, 80%)',
      maxHeight: '85%',
      backgroundColor: '#fff',
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
    headerTitle: {
      margin: 0, fontSize: 'clamp(17px, 4.4vw, 19px)', fontWeight: 800, lineHeight: 1.35,
      // keep-all은 한글 단어를 안 끊어 읽기 좋지만, 공백 없는 긴 문자열은 그대로 넘친다.
      // overflowWrap: anywhere를 같이 줘야 그런 경우에만 강제로 줄바꿈된다.
      wordBreak: 'keep-all', overflowWrap: 'anywhere',
    },
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

    // flex 컬럼으로 둬야 안쪽 splitRow가 flex:1로 남는 높이를 가져갈 수 있다.
    // (height:100% 는 이 자리에서 기준 높이가 안 잡혀 동작하지 않았음)
    content: {
      padding: 'clamp(16px, 4.5vw, 22px)', overflowY: 'auto', flex: 1,
      backgroundColor: '#fff', display: 'flex', flexDirection: 'column', minHeight: 0,
    },

    // 넓고 높은 모달에서 한 줄짜리 내용이 위에만 붙어 아래가 텅 비는 걸 막기 위한 2단 구성.
    // 본문은 왼쪽에서 남는 높이를 채우고, 정보·관리는 오른쪽에 모은다.
    // 좁은 화면에서는 flexWrap으로 자연스럽게 위아래로 쌓인다.
    splitRow: { display: 'flex', flexWrap: 'wrap', gap: '22px', alignItems: 'stretch', flex: 1, minHeight: 0 },
    splitMain: { flex: '3 1 340px', display: 'flex', flexDirection: 'column', minWidth: 0 },
    splitSide: { flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0, overflow: 'hidden' },
    // 본문 상자 — 남는 세로 공간을 채워 아래쪽 여백을 없앤다
    bodyFill: {
      flex: 1, minHeight: '160px', padding: '16px 18px',
      backgroundColor: '#f8fafc', border: `1px solid ${LINE}`, borderRadius: '12px',
      fontSize: '15px', lineHeight: 1.8, color: INK,
      whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', overflowY: 'auto',
    },
    // 오른쪽 정보 목록
    infoList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    infoItem: { display: 'flex', flexDirection: 'column', gap: '3px' },
    infoLabel: { fontSize: '11px', fontWeight: 800, color: '#9aa3af', letterSpacing: '0.06em' },
    infoValue: { fontSize: '14px', fontWeight: 700, color: INK, overflowWrap: 'anywhere' },
    infoBadgeRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
    // 관리 버튼은 가로로 늘어지지 않게 오른쪽 칼럼에서 세로로 쌓는다
    sideActions: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' },
    sideEditBtn: {
      padding: '12px', backgroundColor: NAVY, color: '#fff', border: 'none',
      borderRadius: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '14px', fontFamily: 'inherit',
    },
    sideDeleteBtn: {
      padding: '12px', backgroundColor: '#fff', color: '#c62828', border: '1px solid #c62828',
      borderRadius: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '14px', fontFamily: 'inherit',
    },

    // 섹션 라벨 + 가로선으로 위계 만들기
    section: { marginBottom: '22px' },
    sectionLast: { marginBottom: 0 },
    sectionHead: {
      display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 800,
      color: GRAY, letterSpacing: '0.1em', marginBottom: '9px', textTransform: 'uppercase',
    },
    sectionLine: { flex: 1, height: '1px', backgroundColor: LINE },

    qText: { fontSize: '15px', lineHeight: 1.75, color: INK, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
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
      overflowWrap: 'anywhere',
    },
    // 조교 말풍선·주요 버튼은 화면 색을 따른다. g1은 흰 글자를 올리기엔 밝아서 중간 단계(g2)를 쓴다.
    bubbleAccent: {
      maxWidth: '84%', padding: '12px 15px', borderRadius: '14px', borderBottomRightRadius: '4px',
      backgroundColor: g2, color: '#fff', fontSize: '14px', lineHeight: 1.65, whiteSpace: 'pre-wrap',
      overflowWrap: 'anywhere',
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
      flexShrink: 0, boxSizing: 'border-box', maxWidth: '100%', overflow: 'hidden',
      fontFamily: 'inherit',
    },
    attachBtnActive: {
      display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '11px 15px',
      border: `1px solid ${accent}`, borderRadius: '10px', fontSize: '13px', fontWeight: 700,
      color: accent, cursor: 'pointer', backgroundColor: '#fff', whiteSpace: 'nowrap',
      maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0,
      boxSizing: 'border-box', fontFamily: 'inherit',
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
