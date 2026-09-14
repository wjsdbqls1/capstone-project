// 본문 속 URL을 클릭 가능한 링크로 바꾼다.
//
// dangerouslySetInnerHTML로 HTML을 심지 않고 문자열을 조각내 React 요소로 만든다.
// 학생·조교가 직접 입력한 글이 그대로 들어오는 자리라, HTML 삽입 방식은 XSS 위험이 있다.
import React from 'react';

// http(s)://... 또는 www. 로 시작하는 덩어리
const URL_RE = /(https?:\/\/[^\s<>"')\]]+|www\.[^\s<>"')\]]+)/gi;

// 문장 끝에 붙은 문장부호는 링크에서 뺀다 ("...입니다." 의 마침표 등)
const TRAILING = /[.,;:!?)\]}>'"]+$/;

/**
 * text      원본 문자열
 * linkStyle 링크에 입힐 스타일 (말풍선처럼 배경색이 진한 곳은 색을 따로 넘긴다)
 */
export function linkify(text, linkStyle) {
  if (!text) return text;
  const str = String(text);

  const out = [];
  let last = 0;
  let m;
  URL_RE.lastIndex = 0;

  while ((m = URL_RE.exec(str)) !== null) {
    let raw = m[0];
    const trail = raw.match(TRAILING);
    let tail = '';
    if (trail) {
      tail = trail[0];
      raw = raw.slice(0, -tail.length);
    }
    if (!raw) continue;

    if (m.index > last) out.push(str.slice(last, m.index));
    const href = raw.startsWith('www.') ? `https://${raw}` : raw;
    out.push(
      <a
        key={`${m.index}-${raw}`}
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        style={{ color: 'inherit', textDecoration: 'underline', wordBreak: 'break-all', ...linkStyle }}
        onClick={(e) => e.stopPropagation()}
      >
        {raw}
      </a>
    );
    if (tail) out.push(tail);
    last = m.index + m[0].length;
  }

  if (out.length === 0) return str;
  if (last < str.length) out.push(str.slice(last));
  return out;
}

const ENTITIES = {
  '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"',
  '&#39;': "'", '&apos;': "'", '&nbsp;': ' ',
};

/**
 * 크롤링해 온 공지 본문(HTML)을 순수 텍스트로 바꾼다.
 *
 * 학과 홈페이지에서 가져온 내용은 실제로 <br/>과 바깥 <div> 한 겹뿐이고
 * <a> 태그는 하나도 없다. 그래서 HTML로 심을 이유가 없고, 텍스트로 바꾸면
 * 맨 URL을 링크로 만들 수 있으며 dangerouslySetInnerHTML도 걷어낼 수 있다.
 */
export function htmlToText(html) {
  if (!html) return '';
  let s = String(html);
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/&[a-zA-Z#0-9]+;/g, (m) => (m in ENTITIES ? ENTITIES[m] : m));
  s = s.replace(/ /g, ' ').replace(/\r\n?/g, '\n');
  // 빈 줄이 셋 이상 이어지면 둘로 줄인다
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

export default linkify;
