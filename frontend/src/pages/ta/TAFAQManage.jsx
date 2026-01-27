// src/pages/ta/TAFaqManage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TALayout from './TALayout';
import '../../App.css';

function TAFaqManage() {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [formData, setFormData] = useState({ question: "", answer_html: "" });
  const [file, setFile] = useState(null);

  const fetchFaqs = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get('http://13.219.208.109:8000/faqs', config);
      setFaqs(response.data);
    } catch (error) { console.error("FAQ 로딩 실패:", error); }
  };

  useEffect(() => { fetchFaqs(); }, []);

  const handleSave = async () => {
    if (!formData.question || !formData.answer_html) { alert("질문과 답변을 모두 입력해주세요."); return; }
    const token = localStorage.getItem('token');
    const sendData = new FormData();
    sendData.append("question", formData.question);
    sendData.append("answer_html", formData.answer_html);
    if (file) sendData.append("file", file);

    try {
      const config = { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` } };
      if (isEditMode) {
        await axios.put(`http://13.219.208.109:8000/faqs/${targetId}`, sendData, config);
        alert("수정되었습니다.");
      } else {
        await axios.post(`http://13.219.208.109:8000/faqs`, sendData, config);
        alert("등록되었습니다.");
      }
      setShowModal(false);
      fetchFaqs();
    } catch (error) { alert("저장 실패"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      const token = localStorage.getItem('token');
      try {
        await axios.delete(`http://13.219.208.109:8000/faqs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchFaqs();
      } catch (error) { alert("삭제 실패"); }
    }
  };

  const handleOpenCreate = () => { setIsEditMode(false); setFormData({ question: "", answer_html: "" }); setFile(null); setShowModal(true); };
  const handleOpenEdit = (item) => { setIsEditMode(true); setTargetId(item.id); setFormData({ question: item.question, answer_html: item.answer_html }); setFile(null); setShowModal(true); };

  const filteredFaqs = faqs.filter(item => item.question.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <TALayout>
      <div style={styles.glassBox}>
        <div style={styles.pageTitle}>FAQ 관리</div>
        
        <div style={styles.topBar}>
            <div style={styles.searchWrapper}>
                <span style={{fontSize:'18px'}}>🔍</span>
                <input 
                    type="text" 
                    placeholder="질문 또는 내용 검색..." 
                    style={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button style={styles.createBtn} onClick={handleOpenCreate}>+ 등록</button>
        </div>

        <div style={styles.listArea}>
            {filteredFaqs.length === 0 ? (
                <div style={styles.emptyMessage}>{searchTerm ? "검색 결과가 없습니다." : "등록된 FAQ가 없습니다."}</div>
            ) : (
                filteredFaqs.map((item) => (
                    <div key={item.id} style={styles.card}>
                        <div style={styles.cardContent}>
                            <div style={styles.question}><span style={{color:'#003675', marginRight:'5px'}}>Q.</span>{item.question}{item.original_filename && <span style={styles.fileIcon}> 📎</span>}</div>
                            <div style={styles.answer}><span style={{color:'#666', marginRight:'5px', fontWeight:'bold'}}>A.</span>{item.answer_html}</div>
                        </div>
                        <div style={styles.actionButtons}>
                            <button style={styles.editBtn} onClick={() => handleOpenEdit(item)}>수정</button>
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
              <h3 style={{margin:0, color:'#003675'}}>{isEditMode ? "질문 수정" : "새 질문 등록"}</h3>
              <button onClick={() => setShowModal(false)} style={modalStyles.closeBtn}>✕</button>
            </div>
            <div style={modalStyles.content}>
              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>질문 (Q)</label>
                <input type="text" style={modalStyles.input} placeholder="예: 졸업 요건이 어떻게 되나요?" value={formData.question} onChange={(e) => setFormData({...formData, question: e.target.value})}/>
              </div>
              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>첨부파일</label>
                <input type="file" style={modalStyles.fileInput} onChange={(e) => setFile(e.target.files[0])}/>
              </div>
              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>답변 (A)</label>
                <textarea style={modalStyles.textarea} placeholder="답변 내용을 입력하세요." value={formData.answer_html} onChange={(e) => setFormData({...formData, answer_html: e.target.value})}/>
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
  card: { backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' },
  cardContent: { flex: 1, minWidth: 0 },
  question: { fontWeight: 'bold', fontSize: '16px', marginBottom: '8px', color: '#333' },
  answer: { fontSize: '14px', color: '#555', whiteSpace: 'pre-wrap', lineHeight: '1.5' },
  fileIcon: { fontSize: '14px' },
  actionButtons: { display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '5px', flexShrink: 0 },
  editBtn: { padding: '6px 12px', backgroundColor: '#e3f2fd', color: '#003675', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight:'bold' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight:'bold' },
};

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { width: '90%', maxWidth: '600px', maxHeight: '85%', backgroundColor: 'white', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9' },
  closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' },
  content: { padding: '20px', overflowY: 'auto', flex: 1 },
  inputGroup: { marginBottom: '15px' },
  label: { fontSize: '14px', color: '#333', fontWeight: 'bold', marginBottom: '6px', display: 'block' },
  input: { width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '8px', boxSizing: 'border-box', fontSize: '15px' },
  fileInput: { width: '100%', padding: '8px', border: '1px dashed #ccc', borderRadius: '8px', backgroundColor: '#fafafa' },
  textarea: { width: '100%', minHeight: '180px', padding: '12px', border: '1px solid #ccc', borderRadius: '8px', boxSizing: 'border-box', resize: 'none', fontSize: '15px', lineHeight: '1.5' },
  saveBtn: { width: '100%', padding: '15px', backgroundColor: '#003675', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }
};

export default TAFaqManage;