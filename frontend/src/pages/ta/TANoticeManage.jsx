// src/pages/ta/TANoticeManage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TALayout from './TALayout';

function TANoticeManage() {
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
      const response = await axios.get('http://13.219.208.109:8000/notices?source=internal', { headers: { Authorization: `Bearer ${token}` } });
      setNotices(response.data);
    } catch (error) { console.error(error); }
  };
  useEffect(() => { fetchNotices(); }, []);

  const handleOpenCreate = () => { setIsEditMode(false); setFormData({ title: "", content_html: "", target_grade: 0 }); setFile(null); setShowModal(true); };
  const handleOpenEdit = async (id) => {
    try {
      const response = await axios.get(`http://13.219.208.109:8000/notices/internal/${id}`);
      setFormData({ title: response.data.title, content_html: response.data.content_html, target_grade: response.data.target_grade || 0 });
      setFile(null); setTargetId(id); setIsEditMode(true); setShowModal(true);
    } catch (error) { alert("정보 로딩 실패"); }
  };
  const handleSave = async () => {
    if (!formData.title || !formData.content_html) { alert("입력값 확인 필요"); return; }
    const token = localStorage.getItem('token');
    const sendData = new FormData();
    sendData.append("title", formData.title);
    sendData.append("content_html", formData.content_html);
    sendData.append("target_grade", formData.target_grade);
    if (file) sendData.append("file", file);
    try {
      const config = { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` } };
      if (isEditMode) await axios.put(`http://13.219.208.109:8000/admin/notices/${targetId}`, sendData, config);
      else await axios.post(`http://13.219.208.109:8000/admin/notices`, sendData, config);
      setShowModal(false); fetchNotices();
    } catch (error) { alert("저장 실패"); }
  };

  const filteredList = notices.filter(item => item.title.toLowerCase().includes(keyword.toLowerCase()));
  const getGradeText = (grade) => grade === 0 ? "전체 공지" : `${grade}학년`;
  const getGradeBadgeStyle = (grade) => {
    switch(grade) {
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
        <div style={styles.pageTitle}>공지사항 관리</div>
        <div style={styles.topBar}>
            <input type="text" placeholder="제목 검색..." style={styles.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            <button style={styles.createBtn} onClick={handleOpenCreate}>+ 등록</button>
        </div>
        <div style={styles.listArea}>
            {filteredList.map((item) => (
                <div key={item.id} style={styles.card}>
                    <div style={{flex:1}}>
                        <div style={{display:'flex', gap:'8px', alignItems:'center', marginBottom:'5px'}}>
                            <span style={{...styles.gradeBadge, ...getGradeBadgeStyle(item.target_grade)}}>{getGradeText(item.target_grade)}</span>
                            <span style={styles.date}>{item.posted_date}</span>
                        </div>
                        <div style={styles.title}>{item.title}</div>
                    </div>
                    <button style={styles.editBtn} onClick={() => handleOpenEdit(item.id)}>수정</button>
                </div>
            ))}
        </div>
        {showModal && (
            <div style={modalStyles.overlay}>
                <div style={modalStyles.modal}>
                    <div style={modalStyles.header}><h3>{isEditMode ? "수정" : "등록"}</h3><button onClick={()=>setShowModal(false)}>✕</button></div>
                    <div style={modalStyles.content}>
                        <select style={modalStyles.input} value={formData.target_grade} onChange={e=>setFormData({...formData, target_grade: parseInt(e.target.value)})}>
                            <option value={0}>전체</option><option value={1}>1학년</option><option value={2}>2학년</option><option value={3}>3학년</option><option value={4}>4학년</option>
                        </select>
                        <input style={modalStyles.input} value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} placeholder="제목"/>
                        <textarea style={modalStyles.textarea} value={formData.content_html} onChange={e=>setFormData({...formData, content_html: e.target.value})} placeholder="내용"/>
                        <input type="file" onChange={e=>setFile(e.target.files[0])}/>
                        <button style={modalStyles.saveBtn} onClick={handleSave}>저장</button>
                    </div>
                </div>
            </div>
        )}
    </TALayout>
  );
}

const styles = {
  pageTitle: { fontSize: '24px', fontWeight: 'bold', color: '#003675', marginBottom: '20px' },
  topBar: { display: 'flex', gap: '10px', marginBottom: '15px' },
  searchInput: { flex: 1, padding: '10px', borderRadius: '25px', border: '1px solid #ddd' },
  createBtn: { padding: '10px 20px', backgroundColor: '#003675', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer' },
  listArea: { flex: 1, overflowY: 'auto' },
  card: { backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  gradeBadge: { fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' },
  date: { fontSize: '12px', color: '#888' },
  title: { fontSize: '16px', fontWeight: 'bold', color: '#333' },
  editBtn: { padding: '6px 12px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }
};

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { width: '500px', backgroundColor: 'white', borderRadius: '12px', padding: '20px', display:'flex', flexDirection:'column', gap:'10px' },
  header: { display:'flex', justifyContent:'space-between' },
  content: { display:'flex', flexDirection:'column', gap:'10px' },
  input: { padding: '10px', border: '1px solid #ddd', borderRadius: '8px' },
  textarea: { height: '150px', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', resize: 'none' },
  saveBtn: { padding: '12px', backgroundColor: '#003675', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};

export default TANoticeManage;