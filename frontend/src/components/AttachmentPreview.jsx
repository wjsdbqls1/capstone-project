// 첨부파일 미리보기.
// 이미지는 바로 보여주고, PDF는 누르면 펼친다.
// (PDF를 iframe으로 자동 로드하면, 브라우저가 "PDF를 항상 다운로드" 설정인 경우
//  화면을 열자마자 저장 창이 떠버린다. 그래서 사용자가 누를 때만 펼친다.)
import React, { useState } from 'react';
import { MdAttachFile, MdOpenInNew, MdDownload, MdPictureAsPdf, MdExpandMore, MdExpandLess } from 'react-icons/md';

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
 * url       실제 파일 주소
 * name      화면에 보여줄 원본 파일명
 * maxHeight 미리보기 높이 상한 (좁은 칼럼에서는 작게)
 */
function AttachmentPreview({ url, name, maxHeight = 260 }) {
  const [open, setOpen] = useState(false);
  if (!url) return null;

  const kind = attachmentKind(name || url);
  const label = name || '첨부파일';

  if (kind === 'image') {
    return (
      <div style={styles.wrap}>
        <div style={styles.frame}>
          <a href={url} target="_blank" rel="noreferrer">
            <img src={url} alt={label} style={{ ...styles.image, maxHeight }} />
          </a>
        </div>
        <a href={url} target="_blank" rel="noreferrer" style={styles.openRow}>
          <MdOpenInNew size={14} />
          <span style={styles.fileName}>{label}</span>
        </a>
      </div>
    );
  }

  if (kind === 'pdf') {
    return (
      <div style={styles.wrap}>
        <button type="button" onClick={() => setOpen(v => !v)} style={styles.toggleBtn}>
          <MdPictureAsPdf size={16} style={{ flexShrink: 0, color: '#c62828' }} />
          <span style={styles.fileName}>{label}</span>
          {open ? <MdExpandLess size={18} style={{ flexShrink: 0 }} /> : <MdExpandMore size={18} style={{ flexShrink: 0 }} />}
        </button>
        {open && (
          <div style={styles.frame}>
            <iframe src={url} title={label} style={{ ...styles.pdf, height: maxHeight }} />
          </div>
        )}
        <a href={url} target="_blank" rel="noreferrer" style={styles.openRow}>
          <MdOpenInNew size={14} /> 새 탭에서 열기
        </a>
      </div>
    );
  }

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

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0, maxWidth: '100%' },
  frame: {
    border: '1px solid #e5e8ec', borderRadius: '10px', overflow: 'hidden',
    backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  image: { display: 'block', maxWidth: '100%', objectFit: 'contain', cursor: 'zoom-in' },
  pdf: { width: '100%', border: 'none', display: 'block', backgroundColor: '#fff' },
  toggleBtn: {
    display: 'flex', alignItems: 'center', gap: '8px', width: '100%', boxSizing: 'border-box',
    padding: '10px 13px', border: '1px solid #e5e8ec', borderRadius: '9px',
    backgroundColor: '#fff', color: '#003675', fontSize: '13px', fontWeight: 700,
    fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
  },
  openRow: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', minWidth: 0,
    fontSize: '12.5px', fontWeight: 700, color: '#003675', textDecoration: 'none',
  },
  fileRow: {
    display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, boxSizing: 'border-box',
    padding: '9px 13px', border: '1px solid #e5e8ec', borderRadius: '9px',
    fontSize: '13px', fontWeight: 700, color: '#003675', textDecoration: 'none',
    backgroundColor: '#fff',
  },
  fileName: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  hint: { fontSize: '11.5px', color: '#9aa3af' },
};

export default AttachmentPreview;
