// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';
import bgImage from '../assets/로그인 이미지.jpg'; 

function Register() {
  const navigate = useNavigate();

  // 입력 필드 상태 관리
  const [studentNo, setStudentNo] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [grade, setGrade] = useState(''); // 초기값 공백 (선택 안 함)

  const handleRegister = async () => {
    if (!studentNo || !password || !name || !department || !grade) {
      alert("모든 정보를 입력해주세요.");
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/auth/register', {
        student_no: studentNo,
        password: password,
        name: name,
        department: department,
        grade: parseInt(grade, 10) 
      });

      console.log("회원가입 성공:", response.data);
      alert("회원가입이 완료되었습니다. 로그인 해주세요.");
      navigate('/'); 

    } catch (error) {
      console.error("회원가입 실패:", error);
      if (error.response && error.response.status === 409) {
        alert("이미 존재하는 학번입니다.");
      } else {
        alert("회원가입 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div style={styles.pageContainer}>
      {/* 유리 박스 컨테이너 */}
      <div style={styles.glassBox}>
        
        {/* 타이틀 영역 */}
        <div style={styles.titleArea}>
          <h1 style={styles.mainTitle}>회원가입</h1>
          <h3 style={styles.subTitle}>순천향대학교 행정조교 시스템</h3>
        </div>

        {/* 입력 폼 영역 */}
        <div style={styles.formArea}>
          <input 
            className="input-field" 
            placeholder="학번 (ID로 사용)" 
            value={studentNo} 
            onChange={(e)=>setStudentNo(e.target.value)} 
            style={styles.input}
          />
          <input 
            className="input-field" 
            type="password" 
            placeholder="비밀번호" 
            value={password} 
            onChange={(e)=>setPassword(e.target.value)} 
            style={styles.input}
          />
          <input 
            className="input-field" 
            placeholder="이름" 
            value={name} 
            onChange={(e)=>setName(e.target.value)} 
            style={styles.input}
          />
          <input 
            className="input-field" 
            placeholder="학과 (예: 컴퓨터소프트웨어공학과)" 
            value={department} 
            onChange={(e)=>setDepartment(e.target.value)} 
            style={styles.input}
          />
          
          {/* ★ 수정된 부분: 학년 선택 창 (Select) */}
          <select 
            value={grade} 
            onChange={(e)=>setGrade(e.target.value)} 
            style={{
                ...styles.input, 
                color: grade ? 'black' : '#757575', // 선택 안 했을 땐 placeholder 색상처럼 연하게
                cursor: 'pointer'
            }}
          >
            <option value="" disabled>학년을 선택해주세요</option>
            <option value="1">1학년</option>
            <option value="2">2학년</option>
            <option value="3">3학년</option>
            <option value="4">4학년</option>
          </select>
          
          <div style={styles.btnGroup}>
            <button 
                onClick={handleRegister} 
                style={styles.registerBtn}
                onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 15px rgba(0, 54, 117, 0.3)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 54, 117, 0.2)';
                }}
            >
                가입하기
            </button>
            <button 
                onClick={() => navigate('/')} 
                style={styles.cancelBtn}
            >
                취소
            </button>
          </div>
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
    padding: '20px', 
    boxSizing: 'border-box'
  },
  
  glassBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)', 
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    padding: 'clamp(30px, 5vw, 50px) clamp(20px, 5vw, 40px)', 
    borderRadius: '24px',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)', 
    border: '1px solid rgba(255, 255, 255, 0.6)',
    width: '100%',
    maxWidth: '450px', 
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },

  titleArea: {
    width: '100%', 
    marginBottom: '30px', 
    textAlign: 'center'
  },
  mainTitle: {
    color: '#003675', 
    margin: '0 0 8px 0', 
    fontSize: 'clamp(22px, 5vw, 28px)', 
    fontWeight: '800',
    letterSpacing: '-0.5px'
  },
  subTitle: {
    margin: 0, 
    color: '#555', 
    fontSize: 'clamp(14px, 4vw, 16px)',
    fontWeight: '500',
    opacity: 0.9
  },

  formArea: {
    width: '100%', 
    display:'flex', 
    flexDirection:'column', 
    gap:'12px'
  },
  input: {
    width: '100%',
    padding: '14px', 
    borderRadius: '10px', 
    border: '1px solid rgba(255,255,255,0.5)',
    outline: 'none',
    fontSize: '15px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)', 
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)',
    boxSizing: 'border-box'
  },
  
  btnGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '15px'
  },
  registerBtn: {
    width: '100%',
    padding: '15px', 
    background: '#003675', 
    color: 'white', 
    border: 'none', 
    borderRadius: '10px', 
    fontSize: '16px', 
    fontWeight: 'bold',
    cursor: 'pointer', 
    boxShadow: '0 4px 10px rgba(0, 54, 117, 0.2)',
    transition: 'all 0.2s ease'
  },
  cancelBtn: {
    width: '100%',
    padding: '15px', 
    background: 'rgba(255, 255, 255, 0.5)', 
    color: '#333', 
    border: '1px solid #ccc', 
    borderRadius: '10px', 
    fontSize: '16px', 
    fontWeight: '500', 
    cursor: 'pointer',
    transition: 'background 0.2s'
  }
};

export default Register;