// src/pages/ta/TAFaqManage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TALayout from './TALayout';

function TAFaqManage() {
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
      const response = await axios.get('http://13.219.208.109:8000/faqs', { headers: { Authorization: `Bearer ${token}` } });
      setFaqs(response.data);
    } catch (error) { console.error("FAQ 로딩 실패:", error); }
  };
  useEffect(() => { fetchFaqs(); }, []);

  const handleSave = async () => {
    if (!formData.question || !formData.answer_html) return;
    const token = localStorage.getItem('token');
    const sendData = new FormData();
    sendData.append("question", formData.question);
    sendData.append("answer_html", formData.answer_html);
    if (file) sendData.append("file", file);
    try {
      const config = { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` } };
      if (isEditMode) await axios.put(`http://13.219.208.109:8000/faqs/${targetId}`, sendData, config);
      else await axios.post(`http://13.219.208.109:8000/faqs`, sendData, config);
      setShowModal(false); fetchFaqs();
    } catch (error) { alert("저장 실패"); }
  };

  const handleOpenCreate = () => { setIsEditMode(false); setFormData({ question: "", answer_html: "" }); setFile(null); setShowModal(true); };
  const handleOpenEdit = (item) => { setIsEditMode(true); setTargetId(item.id); setFormData({ question: item.question, answer_html: item.answer_html }); setFile(null); setShowModal(true); };
  const handleDelete = async (id) => { if(window.confirm("삭제?")) { try { await axios.delete(`http://13.219.208.109:8000/faqs/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); fetchFaqs(); } catch(e){} } };

  const filteredFaqs = faqs.filter(item => item.question.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <TALayout>
        <div style={styles.pageTitle}>FAQ 관리</div>
        <div style={styles.topBar}>
            <input type="text" placeholder="검색..." style={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <button style={styles.createBtn} onClick={handleOpenCreate}>+ 등록</button>
        </div>
        <div style={styles.listArea}>
            {filteredFaqs.map((item) => (
                <div key={item.id} style={styles.card}>
                    <div style={{flex:1}}>
                        <div style={{fontWeight:'bold', color:'#003675'}}>Q. {item.question}</div>
                        <div style={{color:'#666', fontSize:'14px', marginTop:'5px'}}>A. {item.answer_html}</div>
                    </div>
                    <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                        <button style={styles.editBtn} onClick={() => handleOpenEdit(item)}>수정</button>
                        <button style={styles.delBtn} onClick={() => handleDelete(item.id)}>삭제</button>
                    </div>
                </div>
            ))}
        </div>
        {showModal && (
            <div style={modalStyles.overlay}>
                <div style={modalStyles.modal}>
                    <div style={modalStyles.header}><h3>{isEditMode?"수정":"등록"}</h3><button onClick={()=>setShowModal(false)}>✕</button></div>
                    <div style={modalStyles.content}>
                        <input style={modalStyles.input} placeholder="질문" value={formData.question} onChange={e=>setFormData({...formData, question:e.target.value})} />
                        <textarea style={modalStyles.textarea} placeholder="답변" value={formData.answer_html} onChange={e=>setFormData({...formData, answer_html:e.target.value})} />
                        <input type="file" onChange={e=>setFile(e.target.files[0])} />
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
  card: { backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  editBtn: { padding: '6px 12px', backgroundColor: '#e3f2fd', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize:'12px', color:'#003675' },
  delBtn: { padding: '6px 12px', backgroundColor: '#ffebee', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize:'12px', color:'#c62828' }
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

export default TAFaqManage;