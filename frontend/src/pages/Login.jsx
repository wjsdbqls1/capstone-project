// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';
import bgImage from '../assets/로그인 이미지.jpg'; 

function Login() {
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!id || !password) {
      alert("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/auth/login', {
          student_no: id, 
          password: password
      });

      const { access_token, role } = response.data;

      localStorage.setItem('token', access_token); 
      localStorage.setItem('role', role);
      localStorage.setItem('student_no', id);

      console.log("로그인 성공! 권한:", role);

      if (role === 'assistant' || role === 'admin') {
        navigate('/ta/main');
      } else {
        navigate('/student/main');
      }

    } catch (error) {
      console.error("로그인 실패:", error);
      alert("로그인 정보가 올바르지 않습니다.");
    }
  };

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
          />
          <input 
            className="input-field" 
            type="password" 
            placeholder="비밀번호" 
            value={password} 
            onChange={(e)=>setPassword(e.target.value)} 
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLogin();
            }}
            style={styles.input}
          />
          
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
        
        {/* 하단 링크 영역 */}
        <div style={styles.footerLink}>
          <span style={{fontSize:'14px', color:'#555'}}>
            계정이 없으신가요?
          </span>
          <button 
            onClick={() => navigate('/register')}
            style={styles.registerBtn}
          >
            회원가입 하기
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
  registerBtn: {
    background: 'none', 
    border: 'none', 
    color: '#003675', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    fontSize: '14px',
    textDecoration: 'underline',
    padding: 0
  }
};

export default Login;