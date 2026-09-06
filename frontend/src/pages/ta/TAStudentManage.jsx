// src/pages/ta/TAStudentManage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MdSearch, MdClose, MdAdd, MdLightbulb } from 'react-icons/md';
import TALayout from './TALayout';
import AnimatedModal from '../../components/AnimatedModal';
import '../../App.css';

const API = 'https://capstone-project-of74.onrender.com';

// 상태 드롭다운 옵션 (표시값 → 서버 전송값)
const STATUS_OPTIONS = [
  { label: '1학년', status: '재학', grade: 1 },
  { label: '2학년', status: '재학', grade: 2 },
  { label: '3학년', status: '재학', grade: 3 },
  { label: '4학년', status: '재학', grade: 4 },
  { label: '휴학', status: '휴학', grade: null },
  { label: '졸업', status: '졸업', grade: null },
];

// 학생 데이터 → 현재 선택된 드롭다운 값(문자열 key)
const currentSelectKey = (s) => {
  if (s.status === '재학') return `재학:${s.grade}`;
  return `${s.status}:`;
};

// 상태 라벨 (뱃지 표시용)
const statusLabel = (s) => {
  if (s.status === '재학') return s.grade ? `${s.grade}학년` : '재학';
  return s.status;
};

const statusColor = (s) => {
  if (s.status === '휴학') return { bg: '#e0e0e0', fg: '#212121' }; // 검은색
  if (s.status === '졸업') return { bg: '#f5f5f5', fg: '#9e9e9e' }; // 회색
  // 재학: 학년별 색상
  switch (s.grade) {
    case 1: return { bg: '#e8f5e9', fg: '#2e7d32' }; // 1학년 초록
    case 2: return { bg: '#e3f2fd', fg: '#1565c0' }; // 2학년 파랑
    case 3: return { bg: '#fff3e0', fg: '#e65100' }; // 3학년 주황
    case 4: return { bg: '#ffebee', fg: '#c62828' }; // 4학년 빨강
    default: return { bg: '#eceff1', fg: '#455a64' };
  }
};

function TAStudentManage() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('재학'); // 기본: 재학
  const [gradeFilter, setGradeFilter] = useState('all');    // 기본: 전체 학년

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ student_no: '', name: '', department: '', grade: 1 });

  const authConfig = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchStudents = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (gradeFilter !== 'all') params.grade = gradeFilter;
      const res = await axios.get(`${API}/admin/students`, { ...authConfig(), params });
      setStudents(res.data);
    } catch (e) {
      console.error('학생 목록 로딩 실패:', e);
      if (e.response && e.response.status === 403) alert('조교 권한이 필요합니다.');
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, gradeFilter]);

  // 학생 등록
  const handleCreate = async () => {
    if (!form.student_no || !form.name) {
      alert('학번과 이름은 필수입니다.');
      return;
    }
    try {
      const res = await axios.post(
        `${API}/admin/students`,
        {
          student_no: form.student_no.trim(),
          name: form.name.trim(),
          department: form.department.trim() || null,
          grade: Number(form.grade),
        },
        authConfig()
      );
      alert(`학생이 등록되었습니다.\n초기 비밀번호: ${res.data.init_password}`);
      setShowModal(false);
      setForm({ student_no: '', name: '', department: '', grade: 1 });
      fetchStudents();
    } catch (e) {
      alert(e.response?.data?.detail || '등록 실패');
    }
  };

  // 상태(학년/휴학/졸업) 변경
  const handleStatusChange = async (student, selectKey) => {
    const opt = STATUS_OPTIONS.find((o) =>
      o.status === '재학' ? `재학:${o.grade}` === selectKey : `${o.status}:` === selectKey
    );
    if (!opt) return;

    const payload = { status: opt.status };
    if (opt.grade !== null) payload.grade = opt.grade;

    try {
      await axios.patch(`${API}/admin/students/${student.id}`, payload, authConfig());
      fetchStudents();
    } catch (e) {
      alert(e.response?.data?.detail || '상태 변경 실패');
    }
  };

  // 비밀번호 초기화
  const handleResetPassword = async (student) => {
    if (!window.confirm(`${student.name} 학생의 비밀번호를 초기화하시겠습니까?`)) return;
    try {
      const res = await axios.post(`${API}/admin/students/${student.id}/reset-password`, {}, authConfig());
      alert(`비밀번호가 초기화되었습니다.\n초기 비밀번호: ${res.data.init_password}`);
    } catch (e) {
      alert(e.response?.data?.detail || '초기화 실패');
    }
  };

  // 삭제
  const handleDelete = async (student) => {
    if (!window.confirm(`${student.name}(${student.student_no}) 학생을 삭제하시겠습니까?`)) return;
    try {
      await axios.delete(`${API}/admin/students/${student.id}`, authConfig());
      fetchStudents();
    } catch (e) {
      alert(e.response?.data?.detail || '삭제 실패');
    }
  };

  return (
    <TALayout>
      <div style={styles.pageTitle}>학생 관리</div>

      {/* 필터 및 검색 바 */}
      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          <select style={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">전체 상태</option>
            <option value="재학">재학</option>
            <option value="휴학">휴학</option>
            <option value="졸업">졸업</option>
          </select>
          <select style={styles.select} value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
            <option value="all">전체 학년</option>
            <option value="1">1학년</option>
            <option value="2">2학년</option>
            <option value="3">3학년</option>
            <option value="4">4학년</option>
          </select>
          <div style={styles.searchWrapper}>
            <MdSearch size={16} color="#666" />
            <input
              type="text"
              placeholder="이름 또는 학번 검색..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} style={{...styles.createBtn, display: 'flex', alignItems: 'center', gap: '4px'}} onClick={() => setShowModal(true)}><MdAdd size={16} /> 학생 등록</motion.button>
      </div>

      <div style={styles.listArea}>
        {students.length === 0 ? (
          <div style={styles.emptyMessage}>
            {searchTerm || statusFilter !== 'all' || gradeFilter !== 'all' ? '검색 조건에 맞는 학생이 없습니다.' : '등록된 학생이 없습니다.'}
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>학번</th>
                <th style={styles.th}>이름</th>
                <th style={styles.th}>학과</th>
                <th style={styles.th}>상태</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const c = statusColor(s);
                return (
                  <tr key={s.id} style={styles.tr}>
                    <td style={styles.td}>{s.student_no}</td>
                    <td style={{ ...styles.td, fontWeight: 'bold' }}>{s.name}</td>
                    <td style={styles.td}>{s.department || '-'}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, backgroundColor: c.bg, color: c.fg }}>
                        {statusLabel(s)}
                      </span>
                      <select
                        style={styles.statusSelect}
                        value={currentSelectKey(s)}
                        onChange={(e) => handleStatusChange(s, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((o) => {
                          const key = o.status === '재학' ? `재학:${o.grade}` : `${o.status}:`;
                          return (
                            <option key={key} value={key}>{o.label}</option>
                          );
                        })}
                      </select>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <motion.button whileTap={{ scale: 0.95 }} style={styles.resetBtn} onClick={() => handleResetPassword(s)}>PW 초기화</motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} style={styles.deleteBtn} onClick={() => handleDelete(s)}>삭제</motion.button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AnimatedModal isOpen={showModal} onClose={() => setShowModal(false)} overlayStyle={modalStyles.overlay} modalStyle={modalStyles.modal}>
            <div style={modalStyles.header}>
              <h3 style={{ margin: 0, color: '#003675' }}>새 학생 등록</h3>
              <button onClick={() => setShowModal(false)} style={modalStyles.closeBtn}><MdClose size={20} /></button>
            </div>
            <div style={modalStyles.content}>
              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>학번 (아이디)</label>
                <input
                  type="text"
                  style={modalStyles.input}
                  placeholder="예: 20260001"
                  value={form.student_no}
                  onChange={(e) => setForm({ ...form, student_no: e.target.value })}
                />
              </div>
              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>이름</label>
                <input
                  type="text"
                  style={modalStyles.input}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>학과</label>
                <input
                  type="text"
                  style={modalStyles.input}
                  placeholder="예: 컴퓨터소프트웨어공학과"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </div>
              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>학년</label>
                <select
                  style={modalStyles.input}
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                >
                  <option value={1}>1학년</option>
                  <option value={2}>2학년</option>
                  <option value={3}>3학년</option>
                  <option value={4}>4학년</option>
                </select>
              </div>
              <div style={{...styles.pwNotice, display: 'flex', alignItems: 'flex-start', gap: '6px'}}>
                <MdLightbulb size={15} style={{flexShrink: 0, marginTop: '1px'}} />
                <span>초기 비밀번호는 <b>학번 + !</b> 로 자동 설정됩니다. (학생이 로그인 후 변경 가능)</span>
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} style={modalStyles.saveBtn} onClick={handleCreate}>등록하기</motion.button>
            </div>
      </AnimatedModal>
    </TALayout>
  );
}

const styles = {
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#003675', marginBottom: '20px' },
  filterBar: { marginBottom: '15px', padding: '10px 15px', backgroundColor: '#f8f9fa', borderRadius: '12px', border: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' },
  filterGroup: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
  select: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #ced4da', backgroundColor: 'white', fontSize: '14px', cursor: 'pointer', outline: 'none', minWidth: '120px' },
  searchWrapper: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ced4da', minWidth: '250px' },
  searchInput: { border: 'none', outline: 'none', fontSize: '14px', width: '100%', backgroundColor: 'transparent' },
  createBtn: { padding: '10px 20px', backgroundColor: '#003675', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },

  listArea: { flex: 1, overflowY: 'auto', padding: '5px' },
  emptyMessage: { textAlign: 'center', marginTop: '50px', color: '#868e96', fontWeight: '500' },

  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  th: { textAlign: 'left', padding: '14px 16px', backgroundColor: '#f1f3f5', color: '#495057', fontSize: '14px', fontWeight: '700', borderBottom: '2px solid #dee2e6' },
  tr: { borderBottom: '1px solid #f1f3f5' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#333', verticalAlign: 'middle' },
  badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', marginRight: '10px', minWidth: '48px', textAlign: 'center' },
  statusSelect: { padding: '5px 8px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '13px', cursor: 'pointer', outline: 'none' },

  resetBtn: { padding: '6px 12px', backgroundColor: '#fff8e1', color: '#f57f17', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', marginRight: '6px' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  pwNotice: { backgroundColor: '#f1f8ff', border: '1px solid #cce5ff', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#0b5394', lineHeight: '1.5' },
};

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { width: '480px', backgroundColor: 'white', borderRadius: '16px', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
  header: { padding: '18px 25px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9' },
  closeBtn: { border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer', color: '#666' },
  content: { padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' },
  inputGroup: { marginBottom: '5px' },
  label: { fontSize: '14px', color: '#333', fontWeight: 'bold', marginBottom: '6px', display: 'block' },
  input: { width: '100%', padding: '12px', border: '1px solid #ced4da', borderRadius: '8px', boxSizing: 'border-box', fontSize: '15px' },
  saveBtn: { width: '100%', padding: '15px', backgroundColor: '#003675', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' },
};

export default TAStudentManage;
