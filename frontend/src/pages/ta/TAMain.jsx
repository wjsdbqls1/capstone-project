// src/pages/ta/TAMain.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function TAMain() {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. 로그인 하고 첫 페이지가 대기중인 문의
    navigate('/ta/pending', { replace: true });
  }, [navigate]);

  return null;
}

export default TAMain;