// src/pages/ta/TANoticeManage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TALayout from './TALayout';
import '../../App.css'; 

function TANoticeManage() {
  const [notices, setNotices] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  
  // 검색 및 필터 상태
  const [keyword, setKeyword] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [formData, setFormData] = useState({ title: "", content_html: "", target_grade: 0 });
  const [file, setFile] = useState(null);

  const fetchNotices = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get('https://capstone-project-of74.onrender.com/notices?source=internal', config);
      setNotices(response.data);
      setFilteredList(response.data);
    } catch (error) {
      console.error("공지 목록 로딩 실패:", error);
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  // 필터링 로직
  useEffect(() => {
    let result = [...notices];

    if (keyword) {
      result = result.filter(item => item.title.toLowerCase().includes(keyword.toLowerCase()));
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      result = result.filter(item => {
        if (!item.posted_date) return false;
        const itemDate = new Date(item.posted_date);
        const itemDateStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

        if (dateFilter === 'today') return itemDateStart.getTime() === todayStart.getTime();
        if (dateFilter === 'week') {
          const day = now.getDay(); 
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(now.setDate(diff));
          monday.setHours(0,0,0,0);
          return itemDate >= monday;
        }
        if (dateFilter === 'month') return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        if (dateFilter === 'year') return itemDate.getFullYear() === now.getFullYear();
        return true;
      });
    }
    setFilteredList(result);
  }, [keyword, dateFilter, notices]);

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setFormData({ title: "", content_html: "", target_grade: 0 });
    setFile(null); 
    setShowModal(true);
  };

  const handleOpenEdit = async (id) => {
    try {
      const response = await axios.get(`https://capstone-project-of74.onrender.com/notices/internal/${id}`);
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
        await axios.put(`https://capstone-project-of74.onrender.com/admin/notices/${targetId}`, sendData, config);
        alert("수정되었습니다.");
      } else {
        await axios.post(`https://capstone-project-of74.onrender.com/admin/notices`, sendData, config);
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
        await axios.delete(`https://capstone-project-of74.onrender.com/admin/notices/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchNotices();
      } catch (error) { alert("삭제 실패"); }
    }
  };

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
        <div style={styles.pageTitle}>공지사항 관리</div>
        
        {/* 필터 및 검색 바 */}
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
                        placeholder="제목 검색..." 
                        style={styles.searchInput}
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                </div>
            </div>
            <button style={styles.createBtn} onClick={handleOpenCreate}>+ 등록</button>
        </div>

        <div style={styles.listArea}>
            {filteredList.length === 0 ? (
                <div style={styles.emptyMessage}>
                    {keyword || dateFilter !== 'all' ? "검색 조건에 맞는 공지사항이 없습니다." : "등록된 공지사항이 없습니다."}
                </div>
            ) : (
                filteredList.map((item) => (
                    <div 
                      key={item.id} 
                      style={styles.card}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
                      }}
                    >
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
                <select style={modalStyles.selectInput} value={formData.target_grade} onChange={(e) => setFormData({...formData, target_grade: parseInt(e.target.value)})}>
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
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#003675', marginBottom: '20px' },
  
  // 필터 바 디자인 (흰색 배경 컨테이너와 구분되도록)
  filterBar: { marginBottom:'15px', padding:'10px 15px', backgroundColor:'#f8f9fa', borderRadius:'12px', border:'1px solid #e9ecef', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px' },
  filterGroup: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
  select: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #ced4da', backgroundColor:'white', fontSize:'14px', cursor:'pointer', outline:'none', minWidth:'120px' },
  searchWrapper: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ced4da', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', minWidth: '250px' },
  searchInput: { border: 'none', outline: 'none', fontSize: '14px', width: '100%', backgroundColor: 'transparent' },
  createBtn: { padding: '10px 20px', backgroundColor: '#003675', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight:'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },

  listArea: { flex: 1, overflowY: 'auto', padding: '5px' },
  emptyMessage: { textAlign: 'center', marginTop: '50px', color: '#868e96', fontWeight: '500' },
  
  // 카드 디자인 (흰색 배경 + 테두리 + 그림자)
  card: { 
    backgroundColor: 'white', 
    padding: '20px', 
    borderRadius: '16px', 
    marginBottom: '15px', 
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)', 
    border: '1px solid #dee2e6',
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    gap: '10px',
    transition: 'all 0.2s ease'
  },
  cardContent: { flex: 1, minWidth: 0 }, 
  metaRow: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '5px' },
  gradeBadge: { fontSize: '11px', padding: '3px 8px', borderRadius: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  date: { fontSize: '12px', color: '#888' },
  fileIcon: { fontSize: '12px' },
  title: { fontSize: '16px', fontWeight: 'bold', color: '#212529', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  
  actionButtons: { display: 'flex', gap: '8px', flexShrink: 0 },
  editBtn: { padding: '6px 12px', backgroundColor: '#e3f2fd', color: '#003675', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight:'bold' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight:'bold' },
};

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { width: '500px', backgroundColor: 'white', borderRadius: '16px', padding: '0', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
  header: { padding:'20px', backgroundColor:'#f8f9fa', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems: 'center' },
  closeBtn: { border:'none', background:'transparent', fontSize:'24px', cursor:'pointer', color:'#666' },
  content: { padding:'25px', display:'flex', flexDirection:'column', gap:'15px' },
  inputGroup: { marginBottom: '10px' },
  label: { fontSize: '14px', color: '#333', fontWeight: 'bold', marginBottom: '6px', display: 'block' },
  input: { width: '100%', padding: '12px', border: '1px solid #ced4da', borderRadius: '8px', boxSizing: 'border-box', fontSize: '15px' },
  selectInput: { width: '100%', padding: '12px', border: '1px solid #ced4da', borderRadius: '8px', fontSize: '15px', backgroundColor: 'white' },
  fileInput: { width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '8px', backgroundColor: '#f8f9fa' },
  textarea: { width: '100%', minHeight: '180px', padding: '12px', border: '1px solid #ced4da', borderRadius: '8px', boxSizing: 'border-box', resize: 'none', fontSize: '15px', lineHeight: '1.5' },
  saveBtn: { width: '100%', padding: '15px', backgroundColor: '#003675', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }
};

export default TANoticeManage;