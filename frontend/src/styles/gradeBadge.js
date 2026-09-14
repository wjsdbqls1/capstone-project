// 학년 배지 색상. 학생 관리 화면 기준이며, 공지 화면들도 같은 색을 쓰도록 여기로 모았다.
// (예전에는 화면마다 따로 정의돼 있어 3학년 색이 #e65100 / #ef6c00 로 갈렸다)
export const GRADE_COLORS = {
  1: { bg: '#e8f5e9', fg: '#2e7d32' }, // 초록
  2: { bg: '#e3f2fd', fg: '#1565c0' }, // 파랑
  3: { bg: '#fff3e0', fg: '#e65100' }, // 주황
  4: { bg: '#ffebee', fg: '#c62828' }, // 빨강
};

export const ALL_GRADE_COLOR = { bg: '#37474f', fg: '#ffffff' };
const FALLBACK = { bg: '#eceff1', fg: '#455a64' };

export const gradeColor = (grade) => GRADE_COLORS[Number(grade)] || FALLBACK;

/** "0" -> [] (전체), "1,3" -> [1, 3] */
export function parseTargetGrades(targetGrades) {
  const parsed = String(targetGrades ?? '0')
    .split(',')
    .map((g) => parseInt(g.trim(), 10))
    .filter((g) => !Number.isNaN(g));
  if (parsed.includes(0)) return [];
  return [...new Set(parsed)].sort((a, b) => a - b);
}

export const badgeBase = {
  fontSize: '12px',
  fontWeight: 'bold',
  padding: '3px 8px',
  borderRadius: '6px',
  whiteSpace: 'nowrap',
  display: 'inline-block',
};

export const gradeBadgeStyle = (grade) => {
  const c = gradeColor(grade);
  return { ...badgeBase, backgroundColor: c.bg, color: c.fg };
};

export const allGradeBadgeStyle = {
  ...badgeBase,
  backgroundColor: ALL_GRADE_COLOR.bg,
  color: ALL_GRADE_COLOR.fg,
};
