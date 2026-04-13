// src/pages/student/StudentAbsence.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../App.css'; 

// 배경 이미지
import bgImage from '../../assets/로그인 이미지.jpg';

function StudentAbsence() {
  const navigate = useNavigate();
  const [absences, setAbsences] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // 입력 폼 상태
  const [formData, setFormData] = useState({
    target_date: '',
    subject: '',
    reason: ''
  });
  const [file, setFile] = useState(null); 

  // 1. 내 공결 내역 가져오기
  const fetchAbsences = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.get('https://capstone-project-of74.onrender.com/absence/me', config);
      setAbsences(response.data);
    } catch (error) {
      console.error("공결 내역 로딩 실패:", error);
    }
  };

  useEffect(() => {
    fetchAbsences();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.target_date || !formData.subject || !formData.reason) {
      alert("날짜, 과목, 사유를 모두 입력해주세요.");
      return;
    }
    if (!file) {
      alert("증빙 서류를 반드시 첨부해야 합니다.");
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
        navigate('/');
        return;
    }

    try {
      const submitData = new FormData();
      submitData.append('target_date', formData.target_date);
      submitData.append('subject', formData.subject);
      submitData.append('reason', formData.reason);
      submitData.append('file', file);

      await axios.post('https://capstone-project-of74.onrender.com/absence', submitData, {
        headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
        }
      });

      alert("공결 신청이 완료되었습니다.");
      setShowForm(false);
      setFormData({ target_date: '', subject: '', reason: '' });
      setFile(null);
      fetchAbsences(); 
    } catch (error) {
      console.error("신청 실패:", error);
      const msg = error.response?.data?.detail || "신청 중 오류가 발생했습니다.";
      alert(`신청 실패: ${msg}`);
    }
  };

  const getStatusStyle = (status) => {
    if (status === 'APPROVED' || status === '승인') return { color: '#4caf50', border: '1px solid #4caf50', backgroundColor: '#e8f5e9' };
    if (status === 'REJECTED' || status === '반려') return { color: '#f44336', border: '1px solid #f44336', backgroundColor: '#ffebee' };
    return { color: '#ff9800', border: '1px solid #ff9800', backgroundColor: '#fff3e0' };
  };

  const translateStatus = (status) => {
    if (status === 'APPROVED') return '승인됨';
    if (status === 'REJECTED') return '반려됨';
    return '검토중';
  };

  return (
    <div style={styles.pageContainer}>
      
      {/* 헤더 */}
      <div style={styles.header}>
        <button 
          style={styles.backBtn} 
          onClick={() => navigate('/student/main')}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
        >
           <span style={{fontSize: '18px', marginBottom: '2px'}}>‹</span> 뒤로가기
        </button>

        <h2 style={{margin: 0, fontSize: 'clamp(20px, 5vw, 24px)', color: 'white', fontWeight: '500'}}>공결 신청</h2>
        
        <div style={{width: '60px'}}></div>
      </div>

      {/* 유리 박스 컨테이너 */}
      <div style={styles.glassContainer}>
        
        {!showForm ? (
          /* 목록 화면 */
          <>
            <button style={styles.createButton} onClick={() => setShowForm(true)}>
              ➕ 공결 신청서 작성하기
            </button>

            <h3 style={styles.sectionTitle}>나의 신청 내역</h3>
            
            <div style={styles.listArea}>
              {absences.length === 0 ? (
                <div style={styles.emptyMessage}>신청 내역이 없습니다.</div>
              ) : (
                absences.map((item) => (
                  <div key={item.id} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <span style={styles.submitDate}>
                         신청일: {item.created_at ? item.created_at.split('T')[0] : '-'}
                      </span>
                      <span style={{...styles.badge, ...getStatusStyle(item.status)}}>
                        {translateStatus(item.status)}
                      </span>
                    </div>
                    
                    <div style={styles.cardBody}>
                      <div style={styles.cardTitle}>{item.course_name}</div>
                      <div style={styles.targetDate}>결석일: {item.absent_date}</div>
                    </div>

                    <div style={styles.cardReason}>사유: {item.reason}</div>
                    
                    {item.status === 'REJECTED' && item.reject_reason && (
                      <div style={styles.rejectBox}>
                        🛑 반려 사유: {item.reject_reason}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* 신청 폼 화면 */
          <div style={styles.formWrapper}>
            <h3 style={{margin:'0 0 20px 0', textAlign:'center', color:'#003675'}}>신청서 작성</h3>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>결석 날짜</label>
              <input 
                type="date" 
                style={styles.input}
                value={formData.target_date}
                onChange={(e) => setFormData({...formData, target_date: e.target.value})}
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>과목명</label>
              <input 
                type="text" 
                placeholder="과목명 / 모두:ALL" 
                style={styles.input}
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>증빙 서류 (필수)</label>
              <input 
                type="file" 
                style={styles.fileInput}
                onChange={handleFileChange}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>사유</label>
              <textarea 
                placeholder="예: 요통으로 인한 공결" 
                style={styles.textarea}
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
              />
            </div>
            
            <div style={styles.buttonGroup}>
              <button style={styles.cancelButton} onClick={() => setShowForm(false)}>취소</button>
              <button style={styles.submitButton} onClick={handleSubmit}>제출하기</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    height: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  
  header: {
    backgroundColor: 'rgba(0, 54, 117, 0.9)', 
    padding: '10px 15px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '55px',
    flexShrink: 0
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    padding: '6px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '20px', 
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    backdropFilter: 'blur(5px)',
    transition: 'all 0.2s ease',
    outline: 'none',
    whiteSpace: 'nowrap'
  },

  glassContainer: {
    flex: 1,
    margin: '15px', // 여백 축소
    // clamp(최소, 권장, 최대) -> 화면 크기에 따라 패딩 자동 조절
    padding: 'clamp(15px, 3vw, 40px)', 
    backgroundColor: 'rgba(255, 255, 255, 0.65)', 
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },

  createButton: { 
    width: '100%', 
    padding: '15px', 
    background: 'linear-gradient(135deg, #003675 0%, #00509d 100%)', 
    color: 'white', 
    border: 'none', 
    borderRadius: '12px', 
    fontSize: '18px', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    marginBottom: '25px',
    boxShadow: '0 4px 10px rgba(0, 54, 117, 0.3)',
    transition: 'transform 0.2s'
  },
  
  sectionTitle: { fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '15px', borderBottom:'2px solid #ddd', paddingBottom:'5px' },
  listArea: { display: 'flex', flexDirection: 'column', gap: '15px' },
  emptyMessage: { textAlign: 'center', color: '#666', marginTop: '30px', fontWeight: 'bold' },

  // 카드 스타일
  card: { 
    backgroundColor: 'white', 
    padding: '20px', 
    borderRadius: '12px', 
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
    border: '1px solid #eee'
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' },
  submitDate: { fontSize: '13px', color: '#888' },
  badge: { fontSize: '13px', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' },
  
  cardBody: { marginBottom: '8px' },
  cardTitle: { fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '4px' },
  targetDate: { fontSize: '15px', color: '#003675', fontWeight: '600' },
  cardReason: { fontSize: '15px', color: '#555', lineHeight: '1.4' },
  
  rejectBox: { 
    marginTop: '12px', 
    padding: '12px', 
    backgroundColor: '#ffebee', 
    color: '#c62828', 
    borderRadius: '8px', 
    fontSize: '14px', 
    fontWeight: 'bold',
    border: '1px solid #ffcdd2'
  },

  // 폼 스타일
  formWrapper: { display: 'flex', flexDirection: 'column', height: '100%' },
  inputGroup: { marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '16px', fontWeight: 'bold', color: '#333' },
  input: { 
    padding: '12px', 
    border: '1px solid #ccc', 
    borderRadius: '8px', 
    fontSize: '16px',
    outline: 'none',
    backgroundColor: 'rgba(255,255,255,0.9)'
  },
  fileInput: { 
    padding: '10px', 
    backgroundColor: 'white', 
    borderRadius: '8px', 
    border: '1px dashed #ccc' 
  },
  textarea: { 
    padding: '12px', 
    border: '1px solid #ccc', 
    borderRadius: '8px', 
    fontSize: '16px', 
    minHeight: '120px', 
    resize: 'none',
    outline: 'none',
    backgroundColor: 'rgba(255,255,255,0.9)',
    fontFamily: 'inherit'
  },
  buttonGroup: { display: 'flex', gap: '15px', marginTop: 'auto', paddingTop: '20px' },
  cancelButton: { 
    flex: 1, 
    padding: '14px', 
    border: '1px solid #bbb', 
    backgroundColor: 'white', 
    borderRadius: '10px', 
    cursor: 'pointer', 
    fontSize: '16px', 
    fontWeight: 'bold', 
    color: '#555' 
  },
  submitButton: { 
    flex: 1, 
    padding: '14px', 
    border: 'none', 
    backgroundColor: '#003675', 
    color: 'white', 
    borderRadius: '10px', 
    cursor: 'pointer', 
    fontSize: '16px', 
    fontWeight: 'bold',
    boxShadow: '0 4px 10px rgba(0, 54, 117, 0.3)'
  }
};

export default StudentAbsence;