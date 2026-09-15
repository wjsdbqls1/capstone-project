// 달력 공통 규칙. 학생 캘린더와 조교 캘린더가 같은 색을 쓰게 한 곳에 둔다.

// 공휴일 판별 (학교 사이트에서 크롤링한 일정 제목 기준).
// 개교기념일은 학교 자체 휴일이라 "대체휴일"이 붙어도 국가 공휴일로 치지 않는다.
export const isHolidayTitle = (title) =>
  !!title && !title.includes('개교기념일') && /휴일|현충일|추석/.test(title);

export const SUNDAY_RED = '#d32f2f';
export const SATURDAY_BLUE = '#1976d2';

/**
 * 날짜 숫자 색. 일요일·공휴일은 빨강, 토요일은 파랑, 나머지는 기본색.
 * dow: getDay() 값, dayEvents: 그 날짜에 걸친 일정 목록
 */
export function dayNumberColor(dow, dayEvents, fallback) {
  if (dow === 0 || (dayEvents || []).some((ev) => isHolidayTitle(ev.title))) return SUNDAY_RED;
  if (dow === 6) return SATURDAY_BLUE;
  return fallback;
}
