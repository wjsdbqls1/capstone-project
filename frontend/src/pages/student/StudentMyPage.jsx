// src/pages/student/StudentMyPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../App.css';
import NotificationToggle from '../../components/NotificationToggle';

// 배경 이미지
import bgImage from '../../assets/로그인 이미지.jpg';

const API = 'https://capstone-project-of74.onrender.com';

function StudentMyPage() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);

  // 비밀번호 변경 모달
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });

  const handleChangePassword = async () => {
    if (!pwForm.current_password || !pwForm.new_password) {
      alert('현재 비밀번호와 새 비밀번호를 입력해주세요.');
      return;
    }
    if (pwForm.new_password.length < 4) {
      alert('새 비밀번호는 4자 이상이어야 합니다.');
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API}/users/me/password`,
        { current_password: pwForm.current_password, new_password: pwForm.new_password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('비밀번호가 변경되었습니다.');
      setShowPwModal(false);
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (e) {
      alert(e.response?.data?.detail || '비밀번호 변경 실패');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate('/');
      return;
    }

    axios.get('https://capstone-project-of74.onrender.com/users/me', {
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

            <NotificationToggle style={styles.changePwButton} activeStyle={styles.notifyActive} />

            <button style={styles.changePwButton} onClick={() => setShowPwModal(true)}>
                비밀번호 변경
            </button>

            <button style={styles.logoutButton} onClick={handleLogout}>
                로그아웃
            </button>
        </div>

      </div>

      {/* 비밀번호 변경 모달 */}
      {showPwModal && (
        <div style={pwStyles.overlay}>
          <div style={pwStyles.modal}>
            <div style={pwStyles.header}>
              <h3 style={{ margin: 0, color: '#003675' }}>비밀번호 변경</h3>
              <button onClick={() => setShowPwModal(false)} style={pwStyles.closeBtn}>✕</button>
            </div>
            <div style={pwStyles.content}>
              <input
                type="password"
                style={pwStyles.input}
                placeholder="현재 비밀번호"
                value={pwForm.current_password}
                onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
              />
              <input
                type="password"
                style={pwStyles.input}
                placeholder="새 비밀번호 (4자 이상)"
                value={pwForm.new_password}
                onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
              />
              <input
                type="password"
                style={pwStyles.input}
                placeholder="새 비밀번호 확인"
                value={pwForm.confirm_password}
                onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
              />
              <button style={pwStyles.saveBtn} onClick={handleChangePassword}>변경하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const pwStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { width: '90%', maxWidth: '400px', backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
  header: { padding: '18px 25px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9' },
  closeBtn: { border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer', color: '#666' },
  content: { padding: '25px', display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { width: '100%', padding: '12px', border: '1px solid #ced4da', borderRadius: '8px', boxSizing: 'border-box', fontSize: '15px' },
  saveBtn: { width: '100%', padding: '14px', backgroundColor: '#003675', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' },
};

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
  
  changePwButton: {
    marginTop: '30px',
    padding: '12px 30px',
    border: '1px solid #003675',
    backgroundColor: 'white',
    color: '#003675',
    borderRadius: '25px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
  },
  notifyActive: {
    backgroundColor: '#003675',
    color: 'white',
  },
  logoutButton: {
    marginTop: '12px',
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