// src/pages/DevPage.jsx
// 개발자(admin) 전용 화면. 조교에게는 열어주지 않는 계정 관련 작업을 여기 모은다.
// 사이드바 어디에도 링크가 없고 주소로만 들어올 수 있으며, 서버도 admin만 통과시킨다.
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { MdSearch, MdLock, MdLogout, MdDashboard, MdCheckCircle } from 'react-icons/md';
import { API_BASE } from '../config';

const API = API_BASE;

const authConfig = () => {
  const token = localStorage.getItem('token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

function DevPage() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);   // 서버가 admin이라고 확인해 주기 전에는 아무것도 그리지 않는다
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);          // 방금 초기화한 결과

  // localStorage의 role은 사용자가 고칠 수 있으므로 서버에 직접 묻는다.
  // (설령 통과해도 실제 초기화 API가 admin만 받으므로 이중으로 막힌다)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/', { replace: true }); return; }
    axios.get(`${API}/users/me`, authConfig())
      .then((res) => {
        if (res.data.role !== 'admin') { navigate('/', { replace: true }); return; }
        setAllowed(true);
      })
      .catch(() => navigate('/', { replace: true }));
  }, [navigate]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const res = await axios.get(`${API}/admin/students`, { ...authConfig(), params });
      setStudents(res.data);
    } catch (e) {
      alert(e.response?.data?.detail || '학생 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => { if (allowed) fetchStudents(); }, [allowed]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = async (s) => {
    // 되돌릴 수 없는 작업이라 학번까지 보여주고 한 번 더 확인받는다
    if (!window.confirm(`${s.name}(${s.student_no}) 학생의 비밀번호를 초기화합니다.\n\n초기화하면 기존 비밀번호는 즉시 사용할 수 없습니다. 진행할까요?`)) return;
    try {
      const res = await axios.post(`${API}/admin/students/${s.id}/reset-password`, {}, authConfig());
      setDone({ name: s.name, student_no: s.student_no, password: res.data.init_password });
    } catch (e) {
      alert(e.response?.data?.detail || '초기화에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/', { replace: true });
  };

  if (!allowed) return <div style={styles.page} />;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.kicker}>DEVELOPER</div>
          <h1 style={styles.title}>개발자 도구</h1>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.ghostBtn} onClick={() => navigate('/ta/main')}>
            <MdDashboard size={15} /> 조교 화면
          </button>
          <button style={styles.ghostBtn} onClick={handleLogout}>
            <MdLogout size={15} /> 로그아웃
          </button>
        </div>
      </header>

      <div style={styles.body}>
        <div style={styles.card}>
          <div style={styles.cardHead}>
            <MdLock size={17} />
            <span>학생 비밀번호 초기화</span>
          </div>
          <p style={styles.desc}>
            초기화하면 비밀번호가 <b>학번 + !</b> 로 바뀌고, 해당 학생은 다음 로그인 때 새 비밀번호를 반드시 정해야 합니다.
          </p>

          {done && (
            <div style={styles.result}>
              <MdCheckCircle size={18} color="#2e7d32" />
              <div>
                <div style={styles.resultTitle}>{done.name}({done.student_no}) 초기화 완료</div>
                <div style={styles.resultBody}>
                  초기 비밀번호 <code style={styles.code}>{done.password}</code> — 학생에게 전달해 주세요.
                </div>
              </div>
              <button style={styles.resultClose} onClick={() => setDone(null)}>닫기</button>
            </div>
          )}

          <div style={styles.searchRow}>
            <div style={styles.searchWrapper}>
              <MdSearch size={17} color="#7b8593" />
              <input
                style={styles.searchInput}
                placeholder="이름 또는 학번으로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchStudents(); }}
              />
            </div>
            <motion.button whileTap={{ scale: 0.97 }} style={styles.searchBtn} onClick={fetchStudents}>
              검색
            </motion.button>
          </div>

          <div style={styles.listArea}>
            {loading ? (
              <div style={styles.empty}>불러오는 중...</div>
            ) : students.length === 0 ? (
              <div style={styles.empty}>조건에 맞는 학생이 없습니다.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>학번</th>
                    <th style={styles.th}>이름</th>
                    <th style={styles.th}>상태</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} style={styles.tr}>
                      <td style={styles.td}>{s.student_no}</td>
                      <td style={{ ...styles.td, fontWeight: 700 }}>{s.name}</td>
                      <td style={styles.td}>
                        {s.status === '재학' ? (s.grade ? `${s.grade}학년` : '재학') : s.status}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <motion.button whileTap={{ scale: 0.95 }} style={styles.resetBtn} onClick={() => handleReset(s)}>
                          PW 초기화
                        </motion.button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={styles.count}>{students.length}명</div>
        </div>
      </div>
    </div>
  );
}

const NAVY = '#003675';
const LINE = '#e5e8ec';

const styles = {
  page: {
    position: 'fixed', inset: 0, backgroundColor: '#f4f6f9',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  header: {
    flexShrink: 0, backgroundColor: NAVY, color: '#fff',
    padding: '14px 22px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
  },
  kicker: { fontSize: '10.5px', letterSpacing: '0.16em', opacity: 0.65, fontWeight: 700 },
  title: { margin: '3px 0 0', fontSize: '19px', fontWeight: 800 },
  headerActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  ghostBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '8px 13px', borderRadius: '9px', cursor: 'pointer',
    backgroundColor: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.28)',
    color: '#fff', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit',
  },

  body: { flex: 1, overflowY: 'auto', padding: '22px', minHeight: 0 },
  card: {
    maxWidth: '860px', margin: '0 auto', backgroundColor: '#fff',
    border: `1px solid ${LINE}`, borderRadius: '14px', padding: '20px',
    boxShadow: '0 4px 16px rgba(0,32,70,0.06)',
  },
  cardHead: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '16px', fontWeight: 800, color: NAVY,
  },
  desc: { fontSize: '13.5px', color: '#5b6572', lineHeight: 1.65, margin: '10px 0 16px' },

  result: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    padding: '13px 15px', marginBottom: '16px',
    backgroundColor: '#edf7ee', border: '1px solid #c8e6c9', borderRadius: '11px',
  },
  resultTitle: { fontSize: '13.5px', fontWeight: 800, color: '#1b5e20' },
  resultBody: { fontSize: '13px', color: '#33691e', marginTop: '4px', lineHeight: 1.6 },
  code: {
    backgroundColor: '#fff', border: '1px solid #c8e6c9', borderRadius: '6px',
    padding: '2px 7px', fontWeight: 800, fontSize: '13px',
  },
  resultClose: {
    marginLeft: 'auto', flexShrink: 0, border: 'none', background: 'none',
    color: '#33691e', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
    textDecoration: 'underline', fontFamily: 'inherit', padding: 0,
  },

  searchRow: { display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' },
  searchWrapper: {
    flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '7px',
    padding: '10px 13px', border: `1px solid ${LINE}`, borderRadius: '10px', backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1, border: 'none', outline: 'none', fontSize: '14px',
    fontFamily: 'inherit', minWidth: 0, backgroundColor: 'transparent',
  },
  searchBtn: {
    padding: '10px 20px', backgroundColor: NAVY, color: '#fff', border: 'none',
    borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, fontFamily: 'inherit',
  },

  listArea: { border: `1px solid ${LINE}`, borderRadius: '11px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', padding: '11px 14px', backgroundColor: '#f7f8fa',
    fontSize: '12px', fontWeight: 800, color: '#7b8593',
    borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap',
  },
  tr: { borderBottom: `1px solid ${LINE}` },
  td: { padding: '11px 14px', fontSize: '13.5px', color: '#1a1d21' },
  resetBtn: {
    padding: '6px 13px', backgroundColor: '#fff8e1', color: '#f57f17', border: '1px solid #ffe0a3',
    borderRadius: '7px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 800, fontFamily: 'inherit',
  },
  empty: { textAlign: 'center', color: '#9aa3af', padding: '36px 0', fontSize: '14px' },
  count: { textAlign: 'right', fontSize: '12px', color: '#9aa3af', marginTop: '9px' },
};

export default DevPage;
