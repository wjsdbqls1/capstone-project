// src/App.jsx
import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import ForcePasswordChange from './pages/ForcePasswordChange';
import PageTransition from './components/PageTransition';
import TALayout from './pages/ta/TALayout';

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

  // 조교(/ta/*) 화면들은 사이드바가 있는 공용 레이아웃(TALayout)을 공유함.
  // 전체 페이지를 pathname으로 매번 새로 키(key)를 주면 메뉴를 클릭할 때마다
  // 사이드바/헤더까지 통째로 사라졌다 나타나 버벅여 보이므로, /ta 구간에서는
  // 키를 고정해 TALayout이 유지되게 하고 내부 콘텐츠만 TALayout이 직접 애니메이션함
  const transitionKey = location.pathname.startsWith('/ta') ? 'ta-section' : location.pathname;

  return (
    <AnimatePresence>
      <Routes location={location} key={transitionKey}>
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

        {/* 2. 조교 화면 라우팅 — TALayout이 사이드바/헤더를 유지한 채
            내부 콘텐츠(Outlet)만 자체적으로 부드럽게 전환함 */}
        <Route path="/ta/main" element={withTransition(<TAMain />)} />
        <Route path="/ta" element={<TALayout />}>
          <Route path="pending" element={<TAPending />} />
          <Route path="completed" element={<TACompleted />} />
          <Route path="notice" element={<TANoticeManage />} />
          <Route path="faq" element={<TAFAQManage />} />
          <Route path="absence" element={<TAAbsenceManage />} />
          <Route path="calendar" element={<TACalendarManage />} />
          <Route path="students" element={<TAStudentManage />} />
          <Route path="ai" element={<TAAIReport />} />
        </Route>
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
