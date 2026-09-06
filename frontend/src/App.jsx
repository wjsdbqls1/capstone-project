// src/App.jsx
import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import ForcePasswordChange from './pages/ForcePasswordChange';
import PageTransition from './components/PageTransition';

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
import TAStudentManage from './pages/ta/TAStudentManage';
import TAAIReport from './pages/ta/TAAIReport';

const withTransition = (el) => <PageTransition>{el}</PageTransition>;

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={withTransition(<Login />)} />
        <Route path="/change-password" element={withTransition(<ForcePasswordChange />)} />

        {/* 1. 학생 화면 라우팅 */}
        <Route path="/student/main" element={withTransition(<StudentMain />)} />
        <Route path="/student/inquiry" element={withTransition(<StudentInquiry />)} />
        <Route path="/student/history" element={withTransition(<StudentHistory />)} />
        <Route path="/student/notice" element={withTransition(<StudentNotice />)} />
        <Route path="/student/faq" element={withTransition(<StudentFAQ />)} />
        <Route path="/student/calendar" element={withTransition(<StudentCalendar />)} />
        <Route path="/student/absence" element={withTransition(<StudentAbsence />)} />
        <Route path="/student/mypage" element={withTransition(<StudentMyPage />)} />
        <Route path="/student/notice/:id" element={withTransition(<StudentNoticeDetail />)} />

        {/* 2. 조교 화면 라우팅 */}
        <Route path="/ta/main" element={withTransition(<TAMain />)} />
        <Route path="/ta/pending" element={withTransition(<TAPending />)} />
        <Route path="/ta/completed" element={withTransition(<TACompleted />)} />
        <Route path="/ta/notice" element={withTransition(<TANoticeManage />)} />
        <Route path="/ta/faq" element={withTransition(<TAFAQManage />)} />
        <Route path="/ta/absence" element={withTransition(<TAAbsenceManage />)} />
        <Route path="/ta/calendar" element={withTransition(<TACalendarManage />)} />
        <Route path="/ta/students" element={withTransition(<TAStudentManage />)} />
        <Route path="/ta/ai" element={withTransition(<TAAIReport />)} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <HashRouter>
      <AnimatedRoutes />
    </HashRouter>
  );
}

export default App;
