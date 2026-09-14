// 알림 기록 종.
// 브라우저 푸시는 닫으면 사라져서 놓친 알림을 볼 수 없다. 서버에 남긴 기록을 여기서 보여준다.
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { MdNotifications, MdClose, MdDoneAll } from 'react-icons/md';
import AnimatedModal from './AnimatedModal';
import { API_BASE } from '../config';

const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : null;
};

const formatWhen = (v) => {
  if (!v) return '';
  const d = new Date(v);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}시간 전`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

/**
 * variant: 'light'  — 남색 헤더 위(학생 화면, 조교 상단바)
 *          'dark'   — 밝은 배경 위
 */
function NotificationBell({ variant = 'light' }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const fetchUnread = useCallback(async () => {
    const cfg = authHeader();
    if (!cfg) return;
    try {
      const res = await axios.get(`${API_BASE}/notifications/unread-count`, cfg);
      setUnread(res.data.count || 0);
    } catch (e) { /* 배지는 없어도 화면 사용에 지장이 없다 */ }
  }, []);

  useEffect(() => { fetchUnread(); }, [fetchUnread]);

  const openList = async () => {
    setOpen(true);
    const cfg = authHeader();
    if (!cfg) return;
    try {
      const res = await axios.get(`${API_BASE}/notifications?limit=50`, cfg);
      setItems(res.data);
    } catch (e) { setItems([]); }
  };

  const handleClickItem = async (item) => {
    const cfg = authHeader();
    if (!item.is_read && cfg) {
      try {
        await axios.post(`${API_BASE}/notifications/${item.id}/read`, {}, cfg);
        setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, is_read: true } : x)));
        setUnread((n) => Math.max(0, n - 1));
      } catch (e) { /* 읽음 표시 실패해도 이동은 계속 */ }
    }
    if (item.url) {
      setOpen(false);
      navigate(item.url);
    }
  };

  const handleReadAll = async () => {
    const cfg = authHeader();
    if (!cfg) return;
    try {
      await axios.post(`${API_BASE}/notifications/read-all`, {}, cfg);
      setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
      setUnread(0);
    } catch (e) { /* 무시 */ }
  };

  const btnStyle = variant === 'dark' ? styles.btnDark : styles.btnLight;

  return (
    <>
      <button style={btnStyle} onClick={openList} aria-label="알림">
        <MdNotifications size={22} />
        {unread > 0 && <span style={styles.badge}>{unread > 99 ? '99+' : unread}</span>}
      </button>

      <AnimatedModal
        isOpen={open}
        onClose={() => setOpen(false)}
        overlayStyle={styles.overlay}
        modalStyle={styles.modal}
      >
        <div style={styles.header}>
          <h3 style={styles.headerTitle}>알림</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {items.some((x) => !x.is_read) && (
              <button style={styles.readAllBtn} onClick={handleReadAll}>
                <MdDoneAll size={14} /> 모두 읽음
              </button>
            )}
            <button style={styles.closeBtn} onClick={() => setOpen(false)}><MdClose size={18} /></button>
          </div>
        </div>

        <div style={styles.list}>
          {items.length === 0 ? (
            <div style={styles.empty}>받은 알림이 없습니다.</div>
          ) : (
            items.map((item) => (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.995 }}
                style={item.is_read ? styles.item : styles.itemUnread}
                onClick={() => handleClickItem(item)}
              >
                <div style={styles.itemTop}>
                  <span style={styles.itemTitle}>
                    {!item.is_read && <span style={styles.dot} />}
                    {item.title || '알림'}
                  </span>
                  <span style={styles.itemWhen}>{formatWhen(item.created_at)}</span>
                </div>
                <div style={styles.itemBody}>{item.message}</div>
              </motion.div>
            ))
          )}
        </div>
      </AnimatedModal>
    </>
  );
}

const BTN_BASE = {
  position: 'relative', width: '38px', height: '38px', flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '50%', cursor: 'pointer', outline: 'none',
  padding: 0, boxSizing: 'border-box',
};

const styles = {
  btnLight: {
    ...BTN_BASE,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    color: 'white',
  },
  btnDark: {
    ...BTN_BASE,
    backgroundColor: '#fff',
    border: '1px solid #e5e8ec',
    color: '#003675',
  },
  badge: {
    position: 'absolute', top: '-3px', right: '-3px',
    minWidth: '18px', height: '18px', padding: '0 5px', boxSizing: 'border-box',
    borderRadius: '999px', backgroundColor: '#e53935', color: '#fff',
    fontSize: '11px', fontWeight: 800, lineHeight: '18px', textAlign: 'center',
  },

  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
    WebkitBackdropFilter: 'blur(3px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200,
  },
  modal: {
    width: 'min(94%, 460px)', maxHeight: '76%', backgroundColor: '#fff',
    borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 18px', backgroundColor: '#003675', color: '#fff', flexShrink: 0,
  },
  headerTitle: { margin: 0, fontSize: '17px', fontWeight: 800 },
  readAllBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '5px 10px', borderRadius: '999px', cursor: 'pointer',
    backgroundColor: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)',
    color: '#fff', fontSize: '11.5px', fontWeight: 700, fontFamily: 'inherit',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.14)', border: 'none', color: '#fff',
    width: '28px', height: '28px', borderRadius: '9px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
  },

  list: { overflowY: 'auto', flex: 1, padding: '8px', minHeight: 0 },
  empty: { textAlign: 'center', color: '#9aa3af', padding: '40px 0', fontSize: '14px' },
  item: {
    padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
    backgroundColor: '#fff', marginBottom: '4px',
  },
  itemUnread: {
    padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
    backgroundColor: '#eef3f9', marginBottom: '4px',
  },
  itemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' },
  itemTitle: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13.5px', fontWeight: 800, color: '#003675', minWidth: 0,
  },
  dot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#e53935', flexShrink: 0 },
  itemWhen: { fontSize: '11.5px', color: '#9aa3af', flexShrink: 0 },
  itemBody: {
    fontSize: '13px', color: '#5b6572', marginTop: '5px', lineHeight: 1.5,
    overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
  },
};

export default NotificationBell;
