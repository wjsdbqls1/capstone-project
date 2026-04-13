// src/pages/student/StudentInquiry.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../App.css';

// 배경 이미지
import bgImage from '../../assets/로그인 이미지.jpg';

function StudentInquiry() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [isRelatedToEvent, setIsRelatedToEvent] = useState(false); 
  const [academicEventId, setAcademicEventId] = useState(''); 
  const [events, setEvents] = useState([]); 

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate('/');
      return;
    }

    axios.get('https://capstone-project-of74.onrender.com/academic-events')
      .then(res => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const validEvents = res.data.filter(event => {
          const endDate = new Date(event.end_date);
          return endDate >= today;
        });

        validEvents.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        setEvents(validEvents);
      })
      .catch(err => console.error("일정 로딩 실패:", err));
  }, [navigate]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    
    if (isRelatedToEvent && academicEventId) {
        formData.append('academic_event_id', academicEventId);
    }
    
    if (file) {
        formData.append('file', file);
    }

    try {
      await axios.post('https://capstone-project-of74.onrender.com/inquiries', formData, { 
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' 
        }
      });

      alert("문의가 등록되었습니다!");
      navigate('/student/history'); 

    } catch (error) {
      console.error("등록 실패:", error);
      if (error.response && error.response.status === 401) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        localStorage.clear();
        navigate('/');
      } else {
        alert("문의 등록에 실패했습니다.");
      }
    }
  };

  return (
    <div style={styles.pageContainer}>
      
      {/* 헤더 */}
      <div style={styles.header}>
        <button 
          style={styles.backBtn} 
          onClick={() => navigate(-1)}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
        >
           <span style={{fontSize: '18px', marginBottom: '2px'}}>‹</span> 뒤로가기
        </button>

        <h2 style={{margin: 0, fontSize: 'clamp(18px, 5vw, 24px)', color: 'white', fontWeight: '500'}}>문의하기</h2>
        
        <div style={{width: '60px'}}></div>
      </div>

      {/* 스크롤 가능한 영역 (유리 박스 컨테이너) */}
      <div style={styles.glassContainer}>
        
        {/* 제목 */}
        <div style={styles.formGroup}>
          <label style={styles.label}>제목</label>
          <input 
            style={styles.input} 
            placeholder="문의 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* 유형 선택 */}
        <div style={styles.formGroup}>
          <label style={styles.label}>문의 유형</label>
          <div style={styles.typeBtnWrapper}>
            <button 
              style={!isRelatedToEvent ? styles.typeBtnActive : styles.typeBtn}
              onClick={() => setIsRelatedToEvent(false)}
            >
              💬 일반 문의
            </button>
            <button 
              style={isRelatedToEvent ? styles.typeBtnActive : styles.typeBtn}
              onClick={() => setIsRelatedToEvent(true)}
            >
              📅 학사일정 관련
            </button>
          </div>
        </div>

        {/* 학사일정 드롭다운 (선택 시 나타남) */}
        {isRelatedToEvent && (
          <div style={styles.formGroup}>
            <label style={styles.label}>관련 일정</label>
            <select 
              style={styles.select}
              value={academicEventId}
              onChange={(e) => setAcademicEventId(e.target.value)}
            >
              <option value="">일정을 선택해주세요</option>
              {events.length > 0 ? (
                events.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.start_date} ~ {ev.end_date})
                  </option>
                ))
              ) : (
                <option disabled>예정된 학사일정이 없습니다.</option>
              )}
            </select>
          </div>
        )}

        {/* 내용 */}
        <div style={styles.formGroup}>
          <label style={styles.label}>내용</label>
          <textarea 
            style={styles.textarea} 
            placeholder="궁금한 내용을 자세히 적어주세요."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* 하단 버튼 그룹 */}
        <div style={styles.buttonGroup}>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{display: 'none'}} 
            onChange={handleFileChange}
          />

          <button style={styles.attachBtn} onClick={handleAttachClick}>
             {file ? `✅ 파일 선택됨: ${file.name}` : "📎 파일 첨부하기"}
          </button>

          <button style={styles.submitBtn} onClick={handleSubmit}>
            등록하기
          </button>
        </div>
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
    overflowY: 'auto', // 페이지 전체 스크롤 허용 (모바일 대응 핵심)
    WebkitOverflowScrolling: 'touch'
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
    margin: '15px',
    padding: 'clamp(20px, 4vw, 30px)', 
    backgroundColor: 'rgba(255, 255, 255, 0.65)', 
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    // 고정 높이 대신 내용에 따라 늘어나게 설정
    flexShrink: 0, 
    marginBottom: '40px' 
  },
  
  formGroup: { marginBottom: '15px' },
  
  label: { 
    display: 'block', 
    marginBottom: '6px', 
    fontWeight: 'bold', 
    color: '#333', 
    fontSize: '15px' 
  },
  
  input: { 
    width: '100%', 
    padding: '12px', 
    borderRadius: '10px', 
    border: '1px solid rgba(0,0,0,0.1)', 
    fontSize: '16px', 
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    boxSizing: 'border-box',
    outline: 'none'
  },
  
  textarea: { 
    width: '100%', 
    height: '150px', // 30vh에서 고정 높이로 변경 (모바일에서 너무 커지지 않게)
    padding: '12px', 
    borderRadius: '10px', 
    border: '1px solid rgba(0,0,0,0.1)', 
    fontSize: '16px', 
    resize: 'none', 
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    boxSizing: 'border-box',
    outline: 'none',
    lineHeight: '1.5'
  },
  
  select: { 
    width: '100%', 
    padding: '12px', 
    borderRadius: '10px', 
    border: '1px solid rgba(0,0,0,0.1)', 
    fontSize: '16px', 
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    boxSizing: 'border-box',
    cursor: 'pointer'
  },

  typeBtnWrapper: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' 
  },
  
  typeBtn: { 
    flex: '1 1 120px', 
    padding: '10px', 
    border: '1px solid #ddd', 
    borderRadius: '10px', 
    backgroundColor: 'rgba(255, 255, 255, 0.5)', 
    color: '#666', 
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap'
  },

  typeBtnActive: { 
    flex: '1 1 120px',
    padding: '10px', 
    border: '1px solid #003675', 
    borderRadius: '10px', 
    backgroundColor: '#003675', 
    color: 'white', 
    fontWeight: 'bold', 
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap'
  },
  
  buttonGroup: { 
    marginTop: '10px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px'
  },
  
  attachBtn: { 
    padding: '12px', 
    border: '1px dashed #003675', 
    borderRadius: '10px', 
    backgroundColor: 'rgba(255, 255, 255, 0.5)', 
    color: '#003675', 
    cursor: 'pointer', 
    fontWeight: 'bold',
    fontSize: '15px'
  },
  
  submitBtn: { 
    padding: '14px',
    border: 'none', 
    borderRadius: '10px', 
    backgroundColor: '#003675', 
    color: 'white', 
    fontSize: '17px',
    fontWeight: 'bold', 
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0, 54, 117, 0.3)',
    marginTop: '5px'
  }
};

export default StudentInquiry;