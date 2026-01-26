// src/pages/student/StudentMyPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../App.css';

// 배경 이미지
import bgImage from '../../assets/로그인 이미지.jpg';

function StudentMyPage() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate('/');
      return;
    }

    axios.get('http://localhost:8000/users/me', {
      headers: {
        Authorization: `Bearer ${token}` 
      }
    })
    .then(response => {
      setUserInfo(response.data);
    })
    .catch(error => {
      console.error("정보 로딩 실패:", error);
      if (error.response && error.response.status === 401) {
        localStorage.clear();
        navigate('/');
      }
    });
  }, [navigate]);

  const handleLogout = () => {
    if(window.confirm("로그아웃 하시겠습니까?")) {
        localStorage.clear();
        navigate('/');
    }
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

        <h2 style={{margin: 0, fontSize: 'clamp(20px, 5vw, 24px)', color: 'white', fontWeight: '500'}}>마이페이지</h2>
        
        <div style={{width: '60px'}}></div>
      </div>

      {/* 유리 박스 컨테이너 */}
      <div style={styles.glassContainer}>
        
        <div style={styles.contentWrapper}>
            <div style={styles.profileHeader}>
                <div style={styles.avatar}>
                    {userInfo ? userInfo.name[0] : '👤'}
                </div>
                <h2 style={styles.userName}>
                    {userInfo ? userInfo.name : '로딩중...'}
                </h2>
                <div style={styles.userRole}>학생</div>
            </div>

            {userInfo ? (
            <div style={styles.infoCard}>
                
                <div style={styles.infoRow}>
                <span style={styles.label}>학번</span>
                <span style={styles.value}>{userInfo.student_no}</span>
                </div>
                
                <div style={styles.divider}></div>
                
                <div style={styles.infoRow}>
                <span style={styles.label}>학과</span>
                <span style={styles.value}>{userInfo.department}</span>
                </div>
                
                <div style={styles.divider}></div>
                
                <div style={styles.infoRow}>
                <span style={styles.label}>학년</span>
                <span style={styles.value}>
                    {userInfo.grade ? `${userInfo.grade}학년` : '-'}
                </span>
                </div>
                
                {userInfo.email && (
                    <>
                        <div style={styles.divider}></div>
                        <div style={styles.infoRow}>
                            <span style={styles.label}>이메일</span>
                            <span style={styles.value}>{userInfo.email}</span>
                        </div>
                    </>
                )}
            </div>
            ) : (
            <div style={{textAlign:'center', padding:'30px', color:'#666'}}>
                정보를 불러오는 중입니다...
            </div>
            )}

            <button style={styles.logoutButton} onClick={handleLogout}>
                로그아웃
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

  // 내부 컨텐츠 래퍼 (스크롤 시 레이아웃 유지)
  contentWrapper: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },

  profileHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '30px',
    width: '100%'
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#003675',
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '15px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
  },
  userName: {
    margin: 0,
    fontSize: '24px',
    color: '#333',
    fontWeight: 'bold'
  },
  userRole: {
    marginTop: '5px',
    fontSize: '14px',
    color: '#666',
    backgroundColor: '#eee',
    padding: '4px 12px',
    borderRadius: '15px',
    fontWeight: 'bold'
  },

  infoCard: {
    // ★ 수정: 부모 너비를 넘지 않도록 100% 설정 및 border-box 적용
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: '0 2px 15px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0',
    flexWrap: 'wrap' // 내용 길면 줄바꿈
  },
  label: {
    color: '#888',
    fontWeight: '600',
    fontSize: '15px',
    minWidth: '60px' // 라벨 최소 너비 확보
  },
  value: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: '17px',
    textAlign: 'right',
    flex: 1, // 남은 공간 차지
    wordBreak: 'break-all' // 긴 텍스트 줄바꿈
  },
  divider: {
    height: '1px',
    backgroundColor: '#f0f0f0',
    width: '100%'
  },
  
  logoutButton: {
    marginTop: '30px',
    padding: '12px 30px',
    border: '1px solid #ff5252',
    backgroundColor: 'white',
    color: '#ff5252',
    borderRadius: '25px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    marginBottom: '10px' // 하단 여백 추가
  }
};

export default StudentMyPage;