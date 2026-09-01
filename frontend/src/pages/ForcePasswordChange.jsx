// src/pages/ForcePasswordChange.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import bgImage from '../assets/로그인 이미지.jpg';

const API = 'https://capstone-project-of74.onrender.com';

function ForcePasswordChange() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const goToMain = () => {
    const role = localStorage.getItem('role');
    navigate(role === 'assistant' || role === 'admin' ? '/ta/main' : '/student/main', { replace: true });
  };

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword) {
      alert('현재 비밀번호와 새 비밀번호를 입력해주세요.');
      return;
    }
    if (newPassword.length < 4) {
      alert('새 비밀번호는 4자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/users/me/password`,
        { current_password: currentPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem('must_change_password', 'false');
      alert('비밀번호가 변경되었습니다.');
      goToMain();
    } catch (e) {
      alert(e.response?.data?.detail || '비밀번호 변경에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.glassBox}>
        <h2 style={styles.title}>비밀번호 변경이 필요합니다</h2>
        <p style={styles.desc}>
          초기 비밀번호를 계속 사용할 수 없습니다.<br />
          새 비밀번호로 변경한 후 이용해주세요.
        </p>

        <input
          type="password"
          placeholder="현재 비밀번호"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="새 비밀번호 (4자 이상)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="새 비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={styles.input}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        />

        <button onClick={handleSubmit} disabled={submitting} style={styles.button}>
          {submitting ? '변경 중...' : '비밀번호 변경'}
        </button>
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
    boxSizing: 'border-box',
  },
  glassBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    padding: '40px 30px',
    borderRadius: '24px',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
    width: '100%',
    maxWidth: '400px',
    boxSizing: 'border-box',
  },
  title: {
    color: '#003675',
    fontSize: '20px',
    marginBottom: '10px',
    textAlign: 'center',
  },
  desc: {
    color: '#555',
    fontSize: '14px',
    textAlign: 'center',
    lineHeight: 1.5,
    marginBottom: '25px',
  },
  input: {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #ccc',
    marginBottom: '12px',
    fontSize: '15px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#003675',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px',
  },
};

export default ForcePasswordChange;
