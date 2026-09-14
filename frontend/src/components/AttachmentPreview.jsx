// 첨부파일 미리보기.
// 이미지와 PDF는 브라우저가 그대로 렌더링할 수 있어 바로 보여주고,
// HWP처럼 브라우저가 못 여는 형식은 기존처럼 다운로드 링크만 둔다.
import React from 'react';
import { MdAttachFile, MdOpenInNew, MdDownload } from 'react-icons/md';

const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

export function attachmentKind(nameOrUrl) {
  const clean = String(nameOrUrl || '').split('?')[0].toLowerCase();
  const dot = clean.lastIndexOf('.');
  const ext = dot === -1 ? '' : clean.slice(dot);
  if (IMAGE_EXT.includes(ext)) return 'image';
  if (ext === '.pdf') return 'pdf';
  return 'file';
}

/**
 * url      실제 파일 주소
 * name     화면에 보여줄 원본 파일명
 * maxHeight 미리보기 높이 상한 (좁은 칼럼에서는 작게)
 */
function AttachmentPreview({ url, name, maxHeight = 260 }) {
  if (!url) return null;
  const kind = attachmentKind(name || url);
  const label = name || '첨부파일';

  if (kind === 'file') {
    return (
      <div style={styles.wrap}>
        <a href={url} target="_blank" rel="noreferrer" style={styles.fileRow}>
          <MdAttachFile size={15} />
          <span style={styles.fileName}>{label}</span>
          <MdDownload size={15} style={{ flexShrink: 0 }} />
        </a>
        <div style={styles.hint}>이 형식은 미리보기를 지원하지 않습니다.</div>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.frame}>
        {kind === 'image' ? (
          // 클릭하면 원본 크기로 새 탭에서 열어본다
          <a href={url} target="_blank" rel="noreferrer">
            <img src={url} alt={label} style={{ ...styles.image, maxHeight }} />
          </a>
        ) : (
          <iframe src={url} title={label} style={{ ...styles.pdf, height: maxHeight }} />
        )}
      </div>
      <a href={url} target="_blank" rel="noreferrer" style={styles.openRow}>
        <MdOpenInNew size={14} />
        <span style={styles.fileName}>{label}</span>
      </a>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 },
  frame: {
    border: '1px solid #e5e8ec', borderRadius: '10px', overflow: 'hidden',
    backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  image: { display: 'block', maxWidth: '100%', objectFit: 'contain', cursor: 'zoom-in' },
  pdf: { width: '100%', border: 'none', display: 'block', backgroundColor: '#fff' },
  openRow: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', minWidth: 0,
    fontSize: '13px', fontWeight: 700, color: '#003675', textDecoration: 'none',
  },
  fileRow: {
    display: 'inline-flex', alignItems: 'center', gap: '7px', minWidth: 0,
    padding: '9px 13px', border: '1px solid #e5e8ec', borderRadius: '9px',
    fontSize: '13px', fontWeight: 700, color: '#003675', textDecoration: 'none',
    backgroundColor: '#fff',
  },
  fileName: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  hint: { fontSize: '11.5px', color: '#9aa3af' },
};

export default AttachmentPreview;
