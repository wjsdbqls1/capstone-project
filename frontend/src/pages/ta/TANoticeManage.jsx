// src/pages/ta/TANoticeManage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TALayout from './TALayout';
import '../../App.css'; 

function TANoticeManage() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [keyword, setKeyword] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [targetId, setTargetId] = useState(null);
  
  const [formData, setFormData] = useState({ title: "", content_html: "", target_grade: 0 });
  const [file, setFile] = useState(null);

  const fetchNotices = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get('http://13.219.208.109:8000/notices?source=internal', config);
      setNotices(response.data);
    } catch (error) {
      console.error("공지 목록 로딩 실패:", error);
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setFormData({ title: "", content_html: "", target_grade: 0 });
    setFile(null); 
    setShowModal(true);
  };

  const handleOpenEdit = async (id) => {
    try {
      const response = await axios.get(`http://13.219.208.109:8000/notices/internal/${id}`);
      setFormData({
        title: response.data.title,
        content_html: response.data.content_html,
        target_grade: response.data.target_grade || 0
      });
      setFile(null); 
      setTargetId(id);
      setIsEditMode(true);
      setShowModal(true);
    } catch (error) { alert("공지 정보를 불러오지 못했습니다."); }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content_html) { alert("제목과 내용을 모두 입력해주세요."); return; }
    const token = localStorage.getItem('token');
    const sendData = new FormData();
    sendData.append("title", formData.title);
    sendData.append("content_html", formData.content_html);
    sendData.append("target_grade", formData.target_grade);
    if (file) sendData.append("file", file);

    try {
      const config = { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` } };
      if (isEditMode) {
        await axios.put(`http://13.219.208.109:8000/admin/notices/${targetId}`, sendData, config);
        alert("수정되었습니다.");
      } else {
        await axios.post(`http://13.219.208.109:8000/admin/notices`, sendData, config);
        alert("등록되었습니다.");
      }
      setShowModal(false);
      fetchNotices();
    } catch (error) { alert("저장 중 오류가 발생했습니다."); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      const token = localStorage.getItem('token');
      try {
        await axios.delete(`http://13.219.208.109:8000/admin/notices/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchNotices();
      } catch (error) { alert("삭제 실패"); }
    }
  };

  const filteredList = notices.filter(item => item.title.toLowerCase().includes(keyword.toLowerCase()));
  const getGradeText = (grade) => grade === 0 ? "전체 공지" : `${grade}학년`;
  const getGradeBadgeStyle = (grade) => {
    switch (grade) {
        case 0: return { backgroundColor: '#37474f', color: 'white' }; 
        case 1: return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
        case 2: return { backgroundColor: '#e3f2fd', color: '#1565c0' };
        case 3: return { backgroundColor: '#fff3e0', color: '#ef6c00' };
        case 4: return { backgroundColor: '#ffebee', color: '#c62828' };
        default: return { backgroundColor: '#eee', color: '#333' };
    }
  };

  return (
    <TALayout>
      <div style={styles.glassBox}>
        <div style={styles.pageTitle}>공지사항 관리</div>
        
        {/* 상단 검색 및 등록 바 */}
        <div style={styles.topBar}>
            <div style={styles.searchWrapper}>
                <span style={{fontSize:'18px'}}>🔍</span>
                <input 
                    type="text" 
                    placeholder="제목 검색..." 
                    style={styles.searchInput}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />
            </div>
            <button style={styles.createBtn} onClick={handleOpenCreate}>+ 등록</button>
        </div>

        <div style={styles.listArea}>
            {filteredList.length === 0 ? (
                <div style={styles.emptyMessage}>등록된 공지사항이 없습니다.</div>
            ) : (
                filteredList.map((item) => (
                    <div key={item.id} style={styles.card}>
                        <div style={styles.cardContent}>
                            <div style={styles.metaRow}>
                                <span style={{...styles.gradeBadge, ...getGradeBadgeStyle(item.target_grade)}}>
                                    {getGradeText(item.target_grade)}
                                </span>
                                <span style={styles.date}>{item.posted_date}</span>
                                {item.original_filename && <span style={styles.fileIcon}>📎</span>}
                            </div>
                            <div style={styles.title}>{item.title}</div>
                        </div>
                        <div style={styles.actionButtons}>
                            <button style={styles.editBtn} onClick={() => handleOpenEdit(item.id)}>수정</button>
                            <button style={styles.deleteBtn} onClick={() => handleDelete(item.id)}>삭제</button>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {showModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <div style={modalStyles.header}>
              <h3 style={{margin:0, color:'#003675'}}>{isEditMode ? "공지사항 수정" : "새 공지사항 등록"}</h3>
              <button onClick={() => setShowModal(false)} style={modalStyles.closeBtn}>✕</button>
            </div>
            <div style={modalStyles.content}>
              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>대상 학년</label>
                <select style={modalStyles.select} value={formData.target_grade} onChange={(e) => setFormData({...formData, target_grade: parseInt(e.target.value)})}>
                  <option value={0}>전체 공지</option>
                  <option value={1}>1학년</option>
                  <option value={2}>2학년</option>
                  <option value={3}>3학년</option>
                  <option value={4}>4학년</option>
                </select>
              </div>
              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>제목</label>
                <input type="text" style={modalStyles.input} value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="제목을 입력하세요"/>
              </div>
              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>첨부파일</label>
                <input type="file" style={modalStyles.fileInput} onChange={(e) => setFile(e.target.files[0])}/>
              </div>
              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>내용</label>
                <textarea style={modalStyles.textarea} placeholder="공지 내용을 입력하세요." value={formData.content_html} onChange={(e) => setFormData({...formData, content_html: e.target.value})}/>
              </div>
              <button style={modalStyles.saveBtn} onClick={handleSave}>{isEditMode ? "수정 완료" : "등록하기"}</button>
            </div>
          </div>
        </div>
      )}
    </TALayout>
  );
}

const styles = {
  glassBox: { backgroundColor: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(15px)', borderRadius: '20px', padding: '30px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' },
  pageTitle: { fontSize: '24px', fontWeight: 'bold', color: '#003675', marginBottom: '20px' },
  topBar: { display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' },
  searchWrapper: { flex: 1, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', padding: '8px 12px', borderRadius: '25px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  searchInput: { border: 'none', outline: 'none', fontSize: '15px', width: '100%', backgroundColor: 'transparent' },
  createBtn: { padding: '10px 16px', backgroundColor: '#003675', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' },
  listArea: { flex: 1, overflowY: 'auto', paddingRight: '5px' },
  emptyMessage: { textAlign: 'center', marginTop: '50px', color: '#555', fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' },
  cardContent: { flex: 1, minWidth: 0 }, 
  metaRow: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '5px' },
  gradeBadge: { fontSize: '11px', padding: '3px 8px', borderRadius: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  date: { fontSize: '12px', color: '#888' },
  fileIcon: { fontSize: '12px' },
  title: { fontSize: '16px', fontWeight: 'bold', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  actionButtons: { display: 'flex', gap: '8px', flexShrink: 0 },
  editBtn: { padding: '6px 12px', backgroundColor: '#f5f5f5', color: '#555', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight:'bold' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight:'bold' },
};

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { width: '90%', maxWidth: '600px', maxHeight: '85%', backgroundColor: 'white', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' },
  header: { padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9' },
  closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' },
  content: { padding: '20px', overflowY: 'auto', flex: 1 },
  inputGroup: { marginBottom: '15px' },
  label: { fontSize: '14px', color: '#333', fontWeight: 'bold', marginBottom: '6px', display: 'block' },
  input: { width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '8px', boxSizing: 'border-box', fontSize: '15px' },
  select: { width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '15px', backgroundColor: 'white' },
  fileInput: { width: '100%', padding: '8px', border: '1px dashed #ccc', borderRadius: '8px', backgroundColor: '#fafafa' },
  textarea: { width: '100%', minHeight: '180px', padding: '12px', border: '1px solid #ccc', borderRadius: '8px', boxSizing: 'border-box', resize: 'none', fontSize: '15px', lineHeight: '1.5' },
  saveBtn: { width: '100%', padding: '15px', backgroundColor: '#003675', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }
};

export default TANoticeManage;