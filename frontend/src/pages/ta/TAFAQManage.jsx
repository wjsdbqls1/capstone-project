// src/pages/ta/TAFaqManage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TALayout from './TALayout';
import '../../App.css';

function TAFaqManage() {
  const [faqs, setFaqs] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]); // 필터링된 리스트
  
  // 상태
  const [searchTerm, setSearchTerm] = useState(""); 
  const [dateFilter, setDateFilter] = useState("all");

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
      setFilteredFaqs(response.data);
    } catch (error) { console.error("FAQ 로딩 실패:", error); }
  };

  useEffect(() => { fetchFaqs(); }, []);

  // 필터링 로직
  useEffect(() => {
    let result = [...faqs];

    // 1. 검색어 필터
    if (searchTerm) {
      result = result.filter(item => 
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.answer_html.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. 날짜 필터 (created_at이 있다고 가정)
    if (dateFilter !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      result = result.filter(item => {
        // created_at이 없을 경우 안전하게 처리 (옵션)
        const dateStr = item.created_at || item.posted_date;
        if (!dateStr) return false;

        const itemDate = new Date(dateStr);
        const itemDateStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

        if (dateFilter === 'today') {
          return itemDateStart.getTime() === todayStart.getTime();
        }
        if (dateFilter === 'week') {
          const day = now.getDay(); 
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(now.setDate(diff));
          monday.setHours(0,0,0,0);
          return itemDate >= monday;
        }
        if (dateFilter === 'month') {
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        }
        if (dateFilter === 'year') {
          return itemDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    setFilteredFaqs(result);
  }, [searchTerm, dateFilter, faqs]);


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

  return (
    <TALayout>
      <div style={styles.glassBox}>
        <div style={styles.pageTitle}>FAQ 관리</div>
        
        {/* 상단 검색 및 필터 바 (디자인 통일) */}
        <div style={styles.filterBar}>
            <div style={styles.filterGroup}>
                <select style={styles.select} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                    <option value="all">📅 전체 기간</option>
                    <option value="today">오늘</option>
                    <option value="week">이번 주</option>
                    <option value="month">이번 달</option>
                    <option value="year">올해</option>
                </select>
                <div style={styles.searchWrapper}>
                    <span style={{fontSize:'16px', color:'#666'}}>🔍</span>
                    <input 
                        type="text" 
                        placeholder="질문 또는 답변 검색..." 
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <button style={styles.createBtn} onClick={handleOpenCreate}>+ 등록</button>
        </div>

        <div style={styles.listArea}>
            {filteredFaqs.length === 0 ? (
                <div style={styles.emptyMessage}>
                    {searchTerm || dateFilter !== 'all' ? "검색 조건에 맞는 FAQ가 없습니다." : "등록된 FAQ가 없습니다."}
                </div>
            ) : (
                filteredFaqs.map((item) => (
                    <div key={item.id} style={styles.card}>
                        <div style={styles.cardContent}>
                            {/* 날짜가 있으면 표시 (선택사항) */}
                            {item.created_at && (
                                <div style={{fontSize:'12px', color:'#999', marginBottom:'5px'}}>{item.created_at.split('T')[0]}</div>
                            )}
                            <div style={styles.question}><span style={{color:'#003675', marginRight:'5px'}}>Q.</span>{item.question}{item.original_filename && <span style={styles.fileIcon}> 📎</span>}</div>
                            <div style={styles.answer}><span style={{color:'#666', marginRight:'5px', fontWeight:'bold'}}>A.</span>{item.answer_html}</div>
                        </div>
                        <div style={styles.actionButtons}>
                            <button style={styles.editBtn} onClick={() => handleOpenEdit(item)}>수정</button>
                            <button style={styles.delBtn} onClick={() => handleDelete(item.id)}>삭제</button>
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
  glassBox: { backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(15px)', borderRadius: '20px', padding: '30px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255,255,255,0.8)' },
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#003675', marginBottom: '20px' },
  
  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '16px', border: '1px solid #e9ecef' },
  filterGroup: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
  select: { padding: '10px 14px', borderRadius: '10px', border: '1px solid #ced4da', backgroundColor: 'white', fontSize: '14px', cursor: 'pointer', color: '#495057', outline: 'none', fontWeight: '500' },
  searchWrapper: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', padding: '10px 16px', borderRadius: '10px', border: '1px solid #ced4da', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', minWidth: '250px' },
  searchInput: { border: 'none', outline: 'none', fontSize: '14px', width: '100%', backgroundColor: 'transparent' },
  createBtn: { padding: '10px 20px', backgroundColor: '#003675', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight:'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },

  listArea: { flex: 1, overflowY: 'auto', paddingRight: '5px' },
  emptyMessage: { textAlign: 'center', marginTop: '50px', color: '#868e96', fontWeight: '500' },
  
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', border: '1px solid #e9ecef' },
  cardContent: { flex: 1, minWidth: 0 },
  question: { fontWeight: 'bold', fontSize: '16px', marginBottom: '8px', color: '#333' },
  answer: { fontSize: '14px', color: '#555', whiteSpace: 'pre-wrap', lineHeight: '1.5' },
  fileIcon: { fontSize: '14px' },
  actionButtons: { display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '5px', flexShrink: 0 },
  editBtn: { padding: '6px 12px', backgroundColor: '#e3f2fd', color: '#003675', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight:'bold' },
  delBtn: { padding: '6px 12px', backgroundColor: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight:'bold' },
};

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { width: '500px', backgroundColor: 'white', borderRadius: '16px', padding: '0', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
  header: { padding:'18px 25px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems: 'center', backgroundColor: '#f9f9f9' },
  closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#868e96' },
  content: { padding: '25px', overflowY: 'auto', flex: 1 },
  inputGroup: { marginBottom: '15px' },
  label: { fontSize: '14px', color: '#333', fontWeight: 'bold', marginBottom: '6px', display: 'block' },
  input: { width: '100%', padding: '12px', border: '1px solid #ced4da', borderRadius: '8px', boxSizing: 'border-box', fontSize: '15px' },
  fileInput: { width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '8px', backgroundColor: '#fafafa' },
  textarea: { width: '100%', minHeight: '180px', padding: '12px', border: '1px solid #ced4da', borderRadius: '8px', boxSizing: 'border-box', resize: 'none', fontSize: '15px', lineHeight: '1.5' },
  saveBtn: { width: '100%', padding: '15px', backgroundColor: '#003675', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }
};

export default TAFaqManage;