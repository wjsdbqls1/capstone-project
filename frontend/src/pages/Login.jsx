// src/pages/Login.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MdChatBubbleOutline, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import '../App.css';
import bgImage from '../assets/로그인 이미지.jpg';
import { API_BASE } from '../config';
import { landingPath } from '../utils/landing';

const API = API_BASE;

function Login() {
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // 앱을 다시 열었을 때 유효한 토큰이 있으면 로그인 화면을 건너뛰고 바로 메인으로 이동
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      setCheckingSession(false);
      return;
    }

    axios.get(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.data.must_change_password) {
          navigate('/change-password', { replace: true });
          return;
        }
        navigate(landingPath(res.data.role || role), { replace: true });
      })
      .catch(() => {
        localStorage.clear();
        setCheckingSession(false);
      });
  }, [navigate]);

  const handleLogin = async () => {
    if (!id || !password) {
      alert("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const response = await axios.post(`${API}/auth/login`, {
          student_no: id.trim(),   // 모바일 자동수정/공백 방지
          password: password
      });

      const { access_token, role, must_change_password } = response.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('role', role);
      localStorage.setItem('student_no', id);

      console.log("로그인 성공! 권한:", role);

      if (must_change_password) {
        navigate('/change-password');
      } else {
        navigate(landingPath(role));
      }

    } catch (error) {
      console.error("로그인 실패:", error);
      if (error.response && error.response.status === 401) {
        alert("아이디 또는 비밀번호가 올바르지 않습니다.");
      } else if (error.response) {
        alert(`로그인 오류가 발생했습니다. (코드 ${error.response.status})`);
      } else {
        // 응답 자체가 없음 = 네트워크/차단/서비스워커 등 연결 문제
        alert("서버에 연결할 수 없습니다. 네트워크(사설 릴레이/콘텐츠 차단) 또는 캐시를 확인해주세요.");
      }
    }
  };

  if (checkingSession) {
    return <div style={styles.pageContainer} />;
  }

  return (
    <div style={styles.pageContainer}>
      {/* 유리 박스 컨테이너 */}
      <div style={styles.glassBox}>

        {/* 타이틀 영역 */}
        <div style={styles.titleArea}>
          <h1 style={styles.mainTitle}>SCH 순천향대학교</h1>
          <h3 style={styles.subTitle}>행정조교 시스템</h3>
        </div>

        {/* 입력 폼 영역 */}
        <div style={styles.formArea}>
          <input
            className="input-field"
            placeholder="학번 / 아이디"
            value={id}
            onChange={(e)=>setId(e.target.value)}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="username"
          />
          {/* 눈 버튼으로 입력한 비밀번호를 잠깐 확인할 수 있게 한다.
              휴대폰에서는 오타를 확인할 방법이 없어 로그인 실패가 잦기 때문 */}
          <div style={styles.pwWrap}>
            <input
              className="input-field"
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호 (초기 비밀번호는 학번 + ! 입니다)"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLogin();
              }}
              style={styles.pwInput}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={styles.eyeBtn}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
            </button>
          </div>
          
          <button 
            onClick={handleLogin} 
            style={styles.loginBtn}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 54, 117, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 54, 117, 0.3)';
            }}
          >
            로그인
          </button>
        </div>
        
        {/* 하단 안내 영역 — 로그인이 안 되면 여기서 바로 문의할 수 있게 */}
        <div style={styles.footerLink}>
          <a
            href="https://open.kakao.com/o/sozeuvNi"
            target="_blank"
            rel="noreferrer"
            style={styles.inquiryBtn}
          >
            <MdChatBubbleOutline size={17} />
            로그인 및 시스템 문의
          </a>
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
    // height:100vh 대신 position:fixed + inset:0 사용.
    // iOS PWA(홈 화면 추가) standalone 모드에서는 100vh가 실제 화면과
    // 어긋나 하단에 흰 여백이 드러나는 경우가 있어, 뷰포트 4면에
    // 항상 정확히 맞춰지는 fixed+inset 방식이 더 안전함
    position: 'fixed',
    inset: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px', // 모바일에서 화면 꽉 참 방지
    boxSizing: 'border-box'
  },
  
  glassBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // 투명도 조절
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    padding: 'clamp(40px, 5vw, 60px) clamp(20px, 5vw, 40px)', // 반응형 패딩
    borderRadius: '24px',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)', 
    border: '1px solid rgba(255, 255, 255, 0.6)',
    width: '100%',
    maxWidth: '420px', // 최대 너비 제한
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },

  titleArea: {
    width: '100%', 
    marginBottom: '40px', 
    textAlign: 'center'
  },
  mainTitle: {
    color: '#003675', 
    margin: '0 0 10px 0', 
    fontSize: 'clamp(24px, 5vw, 32px)', // 반응형 폰트 크기
    fontWeight: '800',
    letterSpacing: '-1px',
    textShadow: '0px 1px 2px rgba(255,255,255,0.5)'
  },
  subTitle: {
    margin: 0, 
    color: '#333', 
    fontSize: 'clamp(16px, 4vw, 18px)',
    fontWeight: '600',
    letterSpacing: '-0.5px',
    opacity: 0.8
  },

  formArea: {
    width: '100%', 
    display:'flex', 
    flexDirection:'column', 
    gap:'15px'
  },
  input: {
    width: '100%',
    padding: '16px', 
    borderRadius: '12px', 
    border: '1px solid rgba(255,255,255,0.5)',
    outline: 'none',
    fontSize: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // 입력창은 잘 보이게 불투명하게
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)',
    boxSizing: 'border-box'
  },
  // 비밀번호 칸은 오른쪽에 눈 버튼이 겹쳐 앉으므로 그만큼 안쪽 여백을 더 준다
  pwWrap: { position: 'relative', width: '100%' },
  pwInput: {
    width: '100%',
    padding: '16px 48px 16px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.5)',
    outline: 'none',
    // 16px보다 작으면 iOS가 입력할 때 화면을 확대해버린다
    fontSize: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)',
    boxSizing: 'border-box',
    // 안내 문구가 길어 좁은 화면에서는 잘리므로 끝을 말줄임으로 알려 준다
    textOverflow: 'ellipsis'
  },
  eyeBtn: {
    position: 'absolute',
    right: '6px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '38px',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    background: 'none',
    border: 'none',
    borderRadius: '9px',
    color: '#5b6572',
    cursor: 'pointer'
  },

  loginBtn: {
    width: '100%',
    padding: '16px', 
    background: '#003675', 
    color: 'white', 
    border: 'none', 
    borderRadius: '12px', 
    fontSize: '18px', 
    fontWeight: 'bold',
    cursor: 'pointer', 
    marginTop: '15px',
    boxShadow: '0 4px 10px rgba(0, 54, 117, 0.3)',
    transition: 'all 0.2s ease'
  },

  footerLink: {
    textAlign: 'center', 
    marginTop: '30px', 
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px'
  },
  // 로그인 버튼(남색 채움)과 역할이 다르므로 테두리만 있는 보조 버튼으로 둔다.
  // <a>는 기본 밑줄·보라색이 붙으므로 색과 장식을 직접 지정해야 한다.
  inquiryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    width: '100%',
    padding: '13px',
    boxSizing: 'border-box',
    borderRadius: '12px',
    border: '1px solid rgba(0, 54, 117, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    color: '#003675',
    fontSize: '15px',
    fontWeight: 700,
    textDecoration: 'none',
    cursor: 'pointer'
  }
};

export default Login;