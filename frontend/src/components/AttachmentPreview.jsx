// 첨부파일 미리보기.
// 이미지는 바로 보여주고, PDF는 누르면 펼친다.
// (PDF를 iframe으로 자동 로드하면, 브라우저가 "PDF를 항상 다운로드" 설정인 경우
//  화면을 열자마자 저장 창이 떠버린다. 그래서 사용자가 누를 때만 펼친다.)
import React, { useState, useEffect, useRef } from 'react';
import { MdAttachFile, MdDownload, MdPictureAsPdf, MdExpandMore, MdExpandLess } from 'react-icons/md';

const MAX_PDF_PAGES = 10;

/**
 * 원본 파일명으로 내려받는다.
 * <a download>는 같은 출처에서만 동작해서, 다른 도메인(Supabase)에 있는 파일에는
 * 무시된다. 그대로 두면 UUID 파일명으로 저장되므로, 내용을 받아 blob으로 바꾼 뒤
 * 내려받아야 원본 이름이 유지된다.
 */
async function downloadFile(url, name) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('download failed');
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = name || '첨부파일';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

function DownloadButton({ url, name }) {
  const [state, setState] = useState('idle');
  const onClick = async () => {
    setState('loading');
    try {
      await downloadFile(url, name);
      setState('idle');
    } catch (e) {
      setState('error');
    }
  };
  return (
    <button type="button" onClick={onClick} disabled={state === 'loading'} style={styles.downloadRow}>
      <MdDownload size={14} />
      {state === 'loading' ? '내려받는 중...' : state === 'error' ? '다시 시도' : '다운로드'}
    </button>
  );
}

/**
 * PDF를 캔버스에 직접 그린다.
 * iframe으로 띄우면 브라우저가 "PDF는 항상 다운로드"로 설정된 경우
 * 미리보기 대신 저장 창이 떠버리기 때문에, 내장 뷰어를 아예 거치지 않는다.
 * 라이브러리는 실제로 PDF를 열 때만 동적으로 불러와 초기 로딩을 늘리지 않는다.
 */
function PdfCanvas({ url, maxHeight }) {
  const holderRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [pageInfo, setPageInfo] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url
        ).toString();

        const doc = await pdfjs.getDocument({ url }).promise;
        if (cancelled) return;

        const holder = holderRef.current;
        if (!holder) return;
        holder.innerHTML = '';

        const total = Math.min(doc.numPages, MAX_PDF_PAGES);
        for (let i = 1; i <= total; i++) {
          const page = await doc.getPage(i);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const width = holder.clientWidth || 600;
          const viewport = page.getViewport({ scale: Math.min(2, width / base.width) });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = '100%';
          canvas.style.display = 'block';
          canvas.style.marginBottom = '6px';
          holder.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        }
        if (cancelled) return;
        setPageInfo(doc.numPages > total ? `${total}/${doc.numPages}쪽까지 표시` : `${doc.numPages}쪽`);
        setStatus('ok');
      } catch (e) {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [url]);

  if (status === 'error') {
    return <div style={styles.hint}>미리보기를 불러오지 못했습니다. 다운로드해 확인해 주세요.</div>;
  }
  return (
    <>
      <div style={{ ...styles.frame, maxHeight, overflowY: 'auto', display: 'block' }}>
        <div ref={holderRef} />
        {status === 'loading' && <div style={styles.loading}>미리보기를 불러오는 중...</div>}
      </div>
      {pageInfo && <div style={styles.hint}>{pageInfo}</div>}
    </>
  );
}

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
        <DownloadButton url={url} name={label} />
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
        {open && <PdfCanvas url={url} maxHeight={maxHeight} />}
        <DownloadButton url={url} name={label} />
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.fileRow}>
        <MdAttachFile size={15} style={{ flexShrink: 0 }} />
        <span style={styles.fileName}>{label}</span>
      </div>
      <DownloadButton url={url} name={label} />
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
  loading: { padding: '20px', fontSize: '13px', color: '#9aa3af', textAlign: 'center' },
  toggleBtn: {
    display: 'flex', alignItems: 'center', gap: '8px', width: '100%', boxSizing: 'border-box',
    padding: '10px 13px', border: '1px solid #e5e8ec', borderRadius: '9px',
    backgroundColor: '#fff', color: '#003675', fontSize: '13px', fontWeight: 700,
    fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
  },
  downloadRow: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    alignSelf: 'flex-start', padding: '8px 14px', borderRadius: '9px',
    border: '1px solid #003675', backgroundColor: '#fff', color: '#003675',
    fontSize: '12.5px', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
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

/**
 * 대화 말풍선 안의 첨부 목록. 이미지는 채팅처럼 바로 보여주고 나머지는 링크로.
 * items: [{ url, name }] (절대 주소), color: 말풍선 글자색(링크색으로 씀)
 */
export function BubbleAttachments({ items, color, linkStyle }) {
  if (!items || !items.length) return null;
  return (
    <div>
      {items.map((a, i) => (
        attachmentKind(a.name || a.url) === 'image' ? (
          <a key={i} href={a.url} target="_blank" rel="noreferrer">
            <img
              src={a.url}
              alt={a.name || '첨부 이미지'}
              style={{ display: 'block', marginTop: '8px', maxWidth: '100%', maxHeight: '200px', borderRadius: '10px', cursor: 'zoom-in' }}
            />
          </a>
        ) : (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            style={{ ...linkStyle, color, display: 'inline-flex', marginRight: '10px' }}
          >
            <MdAttachFile size={12} /> {a.name || '첨부파일'}
          </a>
        )
      ))}
    </div>
  );
}

export default AttachmentPreview;
