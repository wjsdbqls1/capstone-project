// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register'; // ★ 회원가입 페이지 import 추가

// 학생 페이지
import StudentMain from './pages/student/StudentMain';
import StudentInquiry from './pages/student/StudentInquiry';
import StudentHistory from './pages/student/StudentHistory';
import StudentNotice from './pages/student/StudentNotice';
import StudentFAQ from './pages/student/StudentFAQ';
import StudentCalendar from './pages/student/StudentCalendar';
import StudentAbsence from './pages/student/StudentAbsence';
import StudentMyPage from './pages/student/StudentMyPage';
import StudentNoticeDetail from './pages/student/StudentNoticeDetail';

// 조교 페이지
import TAMain from './pages/ta/TAMain';
import TAPending from './pages/ta/TAPending';
import TACompleted from './pages/ta/TACompleted';
import TANoticeManage from './pages/ta/TANoticeManage';
import TAFAQManage from './pages/ta/TAFAQManage';
import TAAbsenceManage from './pages/ta/TAAbsenceManage';
import TACalendarManage from './pages/ta/TACalendarManage';
import TAAIReport from './pages/ta/TAAIReport';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} /> {/* ★ 회원가입 라우트 추가 */}
        
        {/* 1. 학생 화면 라우팅 */}
        <Route path="/student/main" element={<StudentMain />} />
        <Route path="/student/inquiry" element={<StudentInquiry />} />
        <Route path="/student/history" element={<StudentHistory />} />
        <Route path="/student/notice" element={<StudentNotice />} />
        <Route path="/student/faq" element={<StudentFAQ />} />
        <Route path="/student/calendar" element={<StudentCalendar />} />
        <Route path="/student/absence" element={<StudentAbsence />} />
        <Route path="/student/mypage" element={<StudentMyPage />} />
        <Route path="/student/notice/:id" element={<StudentNoticeDetail />} />

        {/* 2. 조교 화면 라우팅 */}
        <Route path="/ta/main" element={<TAMain />} />
        <Route path="/ta/pending" element={<TAPending />} />
        <Route path="/ta/completed" element={<TACompleted />} />
        <Route path="/ta/notice" element={<TANoticeManage />} />
        <Route path="/ta/faq" element={<TAFAQManage />} />
        <Route path="/ta/absence" element={<TAAbsenceManage />} />
        <Route path="/ta/calendar" element={<TACalendarManage />} />
        <Route path="/ta/ai" element={<TAAIReport />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;