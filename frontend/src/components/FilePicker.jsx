// 첨부파일 여러 개 고르기.
// 문의·추가질문·답변·공지·FAQ가 같은 규칙(형식·개수)을 쓰므로 한 곳에 모았다.
// 고른 파일은 아래에 목록으로 보여주고 하나씩 뺄 수 있다.
import React, { useRef } from 'react';
import { MdAttachFile, MdClose } from 'react-icons/md';
import { ACCEPT_ATTACHMENT, MAX_FILES } from '../utils/upload';

const formatSize = (bytes) => {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${bytes}B`;
};

/**
 * files       고른 File 목록
 * onChange    새 목록을 받는 콜백
 * style       버튼 기본 스타일 (화면마다 다름)
 * activeStyle 파일이 하나라도 있을 때 버튼 스타일
 * label       파일이 없을 때 버튼 글자
 */
function FilePicker({ files = [], onChange, style, activeStyle, label = '파일 첨부', fullWidth = false }) {
  const inputRef = useRef(null);

  const handlePick = (e) => {
    const picked = Array.from(e.target.files || []);
    // 같은 파일을 두 번 고르면 한 번만 넣는다
    const merged = [...files];
    for (const f of picked) {
      if (!merged.some((x) => x.name === f.name && x.size === f.size)) merged.push(f);
    }
    if (merged.length > MAX_FILES) {
      alert(`첨부파일은 한 번에 ${MAX_FILES}개까지 올릴 수 있습니다.`);
    }
    onChange(merged.slice(0, MAX_FILES));
    // 같은 파일을 뺐다가 다시 고를 수 있게 input 값을 비운다
    e.target.value = '';
  };

  const remove = (idx) => onChange(files.filter((_, i) => i !== idx));

  const btnStyle = {
    ...(files.length ? { ...style, ...activeStyle } : style),
    ...(fullWidth ? { width: '100%', justifyContent: 'center' } : {}),
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    // width:100%에 안쪽 여백·테두리가 더해져 부모보다 넓어지지 않도록.
    // 화면마다 넘겨주는 버튼 스타일에 이 값이 있기도 없기도 해서 여기서 고정한다.
    boxSizing: 'border-box',
    maxWidth: '100%',
  };

  return (
    <div style={{ width: fullWidth ? '100%' : undefined, minWidth: 0 }}>
      <label style={btnStyle}>
        <MdAttachFile size={15} />
        {files.length ? `파일 ${files.length}개 선택됨` : label}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTACHMENT}
          style={{ display: 'none' }}
          onChange={handlePick}
        />
      </label>

      {files.length > 0 && (
        <ul style={styles.list}>
          {files.map((f, i) => (
            <li key={`${f.name}-${f.size}`} style={styles.item}>
              <span style={styles.name} title={f.name}>{f.name}</span>
              <span style={styles.size}>{formatSize(f.size)}</span>
              <button type="button" style={styles.remove} onClick={() => remove(i)} aria-label={`${f.name} 제거`}>
                <MdClose size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles = {
  list: { listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' },
  item: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '6px 10px', borderRadius: '8px',
    backgroundColor: '#f4f6f9', border: '1px solid #e5e8ec', fontSize: '12.5px', color: '#374151',
  },
  name: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  size: { flexShrink: 0, color: '#9aa3af', fontSize: '11.5px' },
  remove: {
    flexShrink: 0, border: 'none', background: 'none', cursor: 'pointer',
    color: '#9aa3af', padding: '2px', display: 'flex', alignItems: 'center',
  },
};

export default FilePicker;
