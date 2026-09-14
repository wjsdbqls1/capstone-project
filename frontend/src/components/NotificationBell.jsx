// 알림 기록 종.
// 브라우저 푸시는 닫으면 사라져서 놓친 알림을 볼 수 없다. 서버에 남긴 기록을 여기서 보여준다.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
 * variant:   'light' — 남색 헤더 위(학생 화면, 조교 상단바)
 *            'dark'  — 밝은 배경 위
 * placement: 'modal'    — 화면 가운데 모달(학생 화면)
 *            'dropdown' — 종 아래 오른쪽 상단에서 내려오는 패널(조교 화면)
 */
function NotificationBell({ variant = 'light', placement = 'modal' }) {
  const navigate = useNavigate();
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState('all');
  const [anchor, setAnchor] = useState(null);

  const isDropdown = placement === 'dropdown';

  const fetchUnread = useCallback(async () => {
    const cfg = authHeader();
    if (!cfg) return;
    try {
      const res = await axios.get(`${API_BASE}/notifications/unread-count`, cfg);
      setUnread(res.data.count || 0);
    } catch (e) { /* 배지는 없어도 화면 사용에 지장이 없다 */ }
  }, []);

  useEffect(() => { fetchUnread(); }, [fetchUnread]);

  // 드롭다운은 종 버튼 바로 아래에 붙여야 해서 실제 위치를 재서 쓴다.
  // 헤더가 z-index로 쌓임 맥락을 만들기 때문에 패널은 body로 포털해 띄운다.
  const measure = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAnchor({ top: r.bottom + 10, right: Math.max(8, window.innerWidth - r.right) });
  }, []);

  useEffect(() => {
    if (!open || !isDropdown) return;
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open, isDropdown, measure]);

  const openList = async () => {
    if (isDropdown) {
      if (open) { setOpen(false); return; }  // 종을 다시 누르면 닫기
      measure();
    }
    setOpen(true);
    setFilter('all');
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

  const unreadCount = items.filter((x) => !x.is_read).length;
  const shown = filter === 'unread' ? items.filter((x) => !x.is_read) : items;

  const panel = (
    <>
      <div style={styles.header}>
        <h3 style={styles.headerTitle}>알림</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {unreadCount > 0 && (
            <button style={styles.readAllBtn} onClick={handleReadAll}>
              <MdDoneAll size={14} /> 모두 읽음
            </button>
          )}
          <button style={styles.closeBtn} onClick={() => setOpen(false)}><MdClose size={18} /></button>
        </div>
      </div>

      {/* 안 읽은 것만 따로 볼 수 있게 */}
      <div style={styles.tabs}>
        <button
          style={filter === 'all' ? styles.tabOn : styles.tab}
          onClick={() => setFilter('all')}
        >
          전체
        </button>
        <button
          style={filter === 'unread' ? styles.tabOn : styles.tab}
          onClick={() => setFilter('unread')}
        >
          안 읽음{unreadCount > 0 ? ` ${unreadCount}` : ''}
        </button>
      </div>

      <div style={styles.list}>
        {shown.length === 0 ? (
          <div style={styles.empty}>
            {filter === 'unread' ? '안 읽은 알림이 없습니다.' : '받은 알림이 없습니다.'}
          </div>
        ) : (
          shown.map((item) => {
            const isUnread = !item.is_read;
            return (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.995 }}
                style={isUnread ? styles.itemUnread : styles.item}
                onClick={() => handleClickItem(item)}
              >
                <div style={styles.itemTop}>
                  <span style={isUnread ? styles.itemTitleUnread : styles.itemTitle}>
                    {isUnread && <span style={styles.dot} />}
                    {item.title || '알림'}
                  </span>
                  <span style={styles.itemWhen}>{formatWhen(item.created_at)}</span>
                </div>
                <div style={isUnread ? styles.itemBodyUnread : styles.itemBody}>{item.message}</div>
              </motion.div>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <>
      <button ref={btnRef} style={variant === 'dark' ? styles.btnDark : styles.btnLight} onClick={openList} aria-label="알림">
        <MdNotifications size={22} />
        {unread > 0 && <span style={styles.badge}>{unread > 99 ? '99+' : unread}</span>}
      </button>

      {isDropdown
        ? createPortal(
            <AnimatePresence>
              {open && anchor && (
                <>
                  {/* 바깥을 누르면 닫히도록. 배경은 어둡게 하지 않는다 */}
                  <div style={styles.ddScrim} onClick={() => setOpen(false)} />
                  <motion.div
                    style={{ ...styles.ddPanel, top: anchor.top, right: anchor.right }}
                    initial={{ opacity: 0, y: -14, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  >
                    {panel}
                  </motion.div>
                </>
              )}
            </AnimatePresence>,
            document.body
          )
        : (
          <AnimatedModal
            isOpen={open}
            onClose={() => setOpen(false)}
            overlayStyle={styles.overlay}
            modalStyle={styles.modal}
          >
            {panel}
          </AnimatedModal>
        )}
    </>
  );
}

const BTN_BASE = {
  position: 'relative', width: '38px', height: '38px', flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '50%', cursor: 'pointer', outline: 'none',
  padding: 0, boxSizing: 'border-box',
};

const PANEL_BASE = {
  backgroundColor: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden',
};

// 읽음/안 읽음 항목의 공통 뼈대. 차이는 색·굵기·왼쪽 띠로만 준다.
const ITEM_BASE = {
  padding: '11px 13px', borderRadius: '10px', cursor: 'pointer',
  marginBottom: '4px', borderLeft: '3px solid transparent',
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

  // 학생 화면: 가운데 모달
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
    WebkitBackdropFilter: 'blur(3px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200,
  },
  modal: {
    ...PANEL_BASE,
    width: 'min(94%, 460px)', maxHeight: '76%',
    borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
  },

  // 조교 화면: 오른쪽 상단에서 내려오는 패널
  ddScrim: { position: 'fixed', inset: 0, zIndex: 2000 },
  ddPanel: {
    ...PANEL_BASE,
    position: 'fixed', zIndex: 2001,
    width: 'min(380px, calc(100vw - 16px))',
    maxHeight: 'min(70vh, 560px)',
    borderRadius: '14px',
    border: '1px solid #e5e8ec',
    boxShadow: '0 18px 44px rgba(0,32,70,0.24)',
    transformOrigin: 'top right',
  },

  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', backgroundColor: '#003675', color: '#fff', flexShrink: 0,
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

  tabs: {
    display: 'flex', gap: '6px', padding: '10px 12px 8px',
    borderBottom: '1px solid #eef1f4', flexShrink: 0,
  },
  tab: {
    padding: '5px 12px', borderRadius: '999px', cursor: 'pointer',
    backgroundColor: '#f2f4f7', border: '1px solid transparent',
    color: '#7b8593', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit',
  },
  tabOn: {
    padding: '5px 12px', borderRadius: '999px', cursor: 'pointer',
    backgroundColor: '#003675', border: '1px solid #003675',
    color: '#fff', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit',
  },

  list: { overflowY: 'auto', flex: 1, padding: '8px', minHeight: 0 },
  empty: { textAlign: 'center', color: '#9aa3af', padding: '40px 0', fontSize: '14px' },

  // 안 읽음: 흰 배경 + 왼쪽 남색 띠 + 진한 글씨
  itemUnread: {
    ...ITEM_BASE,
    backgroundColor: '#fff',
    borderLeft: '3px solid #003675',
    boxShadow: '0 1px 4px rgba(0,32,70,0.10)',
  },
  // 읽음: 배경을 가라앉히고 글씨를 흐리게 해서 한눈에 구분되게
  item: {
    ...ITEM_BASE,
    backgroundColor: '#f7f8fa',
  },

  itemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' },
  itemTitleUnread: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13.5px', fontWeight: 800, color: '#003675', minWidth: 0,
  },
  itemTitle: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13.5px', fontWeight: 600, color: '#98a1ad', minWidth: 0,
  },
  dot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#e53935', flexShrink: 0 },
  itemWhen: { fontSize: '11.5px', color: '#a8b0ba', flexShrink: 0 },

  itemBodyUnread: {
    fontSize: '13px', color: '#4a5563', marginTop: '5px', lineHeight: 1.5,
    overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
  },
  itemBody: {
    fontSize: '13px', color: '#aeb6c0', marginTop: '5px', lineHeight: 1.5,
    overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
  },
};

export default NotificationBell;
