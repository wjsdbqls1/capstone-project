// src/pages/student/StudentNoticeDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../App.css'; 

// 배경 이미지
import bgImage from '../../assets/로그인 이미지.jpg'; 

function StudentNoticeDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source'); 
  const navigate = useNavigate();

  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await axios.get(`http://13.219.208.109:8000/notices/internal/${id}`);
        setNotice(response.data);
      } catch (error) {
        console.error("상세 정보 로딩 실패:", error);
        alert("공지사항을 불러올 수 없습니다.");
        navigate(-1);
      }
    };
    fetchDetail();
  }, [id, navigate]);

  if (!notice) {
    return (
        <div style={{...styles.pageContainer, justifyContent:'center', color: 'white', fontSize:'20px'}}>
            로딩중...
        </div>
    );
  }

  const getFileUrl = () => {
    if (!notice.file_path) return "";
    if (source === 'external') {
      return `http://13.219.208.109:8000/uploads/external_notices/${notice.file_path}`;
    }
    return `http://13.219.208.109:8000/uploads/notices/${notice.file_path}`;
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
        
        {/* clamp: 최소 18px ~ 최대 24px */}
        <h2 style={{margin: 0, fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: '600', color: 'white'}}>공지 상세</h2>
        
        {/* 균형을 위한 빈 박스 */}
        <div style={{width: '60px'}}></div> 
      </div>

      {/* 상세 내용 유리 박스 */}
      <div style={styles.glassContainer}>
        
        {/* 제목 영역 */}
        <div style={styles.titleSection}>
          <div style={styles.badgeWrapper}>
             <span style={styles.badge}>
               {notice.target_grade === 0 ? '전체' : `${notice.target_grade}학년`}
             </span>
             {source === 'external' && <span style={styles.extBadge}>학과홈페이지</span>}
          </div>
          <h1 style={styles.title}>{notice.title}</h1>
          <div style={styles.date}>작성일: {notice.posted_date}</div>
        </div>

        {/* 파일 다운로드 영역 */}
        {notice.file_path && (
          <div style={styles.fileCard}>
            <div style={styles.fileInfo}>
                <span style={{fontSize:'24px'}}>💾</span>
                <div style={{minWidth: 0}}> {/* 텍스트 말줄임표 위해 필수 */}
                    <div style={{fontSize:'12px', color:'#666', marginBottom:'2px'}}>첨부파일</div>
                    <a 
                      href={getFileUrl()} 
                      download={notice.original_filename} 
                      style={styles.downloadLink}
                    >
                      {notice.original_filename}
                    </a>
                </div>
            </div>
            <a 
              href={getFileUrl()} 
              download={notice.original_filename} 
              style={styles.downloadBtn}
            >
              다운로드
            </a>
          </div>
        )}

        {/* 본문 내용 */}
        <div style={styles.bodySection}>
          <div 
             className="notice-content" // CSS 클래스 (App.css에서 img max-width 제어 추천)
             style={{
                 whiteSpace: 'pre-wrap', 
                 minHeight: '200px', 
                 wordBreak: 'break-word', // 긴 단어 줄바꿈
                 overflowX: 'auto' // 표나 큰 이미지 스크롤
             }} 
             dangerouslySetInnerHTML={{ __html: notice.content_html }} 
          />
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
    overflow: 'hidden'
  },
  
  header: {
    backgroundColor: 'rgba(0, 54, 117, 0.9)', 
    padding: '10px 15px', // 모바일 패딩 축소
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
    margin: '15px',
    // clamp(최소, 권장, 최대) -> 패딩 자동 조절
    padding: 'clamp(20px, 5vw, 40px)', 
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    overflowY: 'auto',
    maxWidth: '800px',
    width: '90%', // 모바일에서는 거의 꽉 차게
    alignSelf: 'center',
    boxSizing: 'border-box' // 패딩 포함 크기 계산
  },

  titleSection: {
    borderBottom: '2px solid rgba(0, 54, 117, 0.1)',
    paddingBottom: '20px',
    marginBottom: '20px'
  },
  badgeWrapper: { display: 'flex', gap: '8px', marginBottom: '10px' },
  badge: { display: 'inline-block', padding: '4px 10px', backgroundColor: '#003675', color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  extBadge: { display: 'inline-block', padding: '4px 10px', backgroundColor: '#ef6c00', color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  
  // 제목 폰트 반응형 적용
  title: { 
    fontSize: 'clamp(20px, 5vw, 28px)', 
    fontWeight: '800', 
    color: '#1a1a1a', 
    marginBottom: '10px', 
    lineHeight: '1.4',
    wordBreak: 'keep-all' // 단어 단위로 줄바꿈 (한글 최적화)
  },
  date: { fontSize: '13px', color: '#666', textAlign: 'right' },

  fileCard: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '12px',
    marginBottom: '30px',
    border: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap', // 화면 좁으면 줄바꿈
    gap: '10px'
  },
  fileInfo: {
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px',
    flex: 1, // 남은 공간 차지
    minWidth: '200px' // 너무 작아지면 줄바꿈 유도
  },
  downloadLink: { 
    textDecoration: 'none', 
    color: '#333', 
    fontWeight: 'bold', 
    fontSize: '14px',
    // 긴 파일명 처리
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%'
  },
  downloadBtn: {
    backgroundColor: 'white',
    color: '#003675',
    padding: '8px 12px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 'bold',
    border: '1px solid #003675',
    whiteSpace: 'nowrap', // 버튼 글자 줄바꿈 방지
    transition: 'background 0.2s'
  },

  bodySection: { 
    fontSize: '16px', 
    lineHeight: '1.8', 
    color: '#333',
    padding: '0 5px',
    maxWidth: '100%'
  }
};

export default StudentNoticeDetail;