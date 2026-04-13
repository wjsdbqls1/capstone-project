# backend/models.py
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db import Base

# --- 1. 유저 모델 (User) ---
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    student_no = Column(String(20), unique=True, nullable=False)
    grade = Column(Integer, nullable=True)
    name = Column(String(50), nullable=False)
    department = Column(String(100), nullable=True)
    role = Column(String(20), nullable=False, default="student")  # student/assistant/admin
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # email 컬럼 삭제 (DB 충돌 방지)

    # ★ 관계 설정
    memos = relationship("CalendarMemo", back_populates="owner")
    notices = relationship("Notice", back_populates="author")
    inquiries = relationship("Inquiry", back_populates="user")
    absence_requests = relationship("AbsenceRequest", back_populates="user")


# --- 2. 문의 관련 모델 (Inquiry) ---
class Inquiry(Base):
    __tablename__ = "inquiries"
    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="OPEN")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    academic_event_id = Column(Integer, ForeignKey("academic_events.id"), nullable=True)
    attachment = Column(String(255), nullable=True)

    user = relationship("User", back_populates="inquiries")
    academic_event = relationship("AcademicEvent")

class InquiryReply(Base):
    __tablename__ = "inquiry_replies"
    id = Column(Integer, primary_key=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id"), nullable=False)
    assistant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())
    attachment = Column(String(255), nullable=True)

class InquiryHistory(Base):
    __tablename__ = "inquiry_history"
    id = Column(Integer, primary_key=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id"), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False)
    detail = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Attachment(Base):
    __tablename__ = "attachments"
    id = Column(Integer, primary_key=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id"), nullable=False)

    original_name = Column(String(255), nullable=False)
    stored_name = Column(String(255), nullable=False)
    mime = Column(String(100), nullable=True)
    size = Column(Integer, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# --- 3. 알림 및 공지사항 모델 ---
class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String(255), nullable=False)
    is_read = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")

class ExternalNotice(Base):
    __tablename__ = "external_notices"
    id = Column(Integer, primary_key=True)
    source = Column(String(50), nullable=False, default="csw_homepage")
    article_no = Column(String(50), nullable=False, unique=True)
    title = Column(String(255), nullable=False)
    author = Column(String(100), nullable=True)
    posted_date = Column(Date, nullable=True)
    views = Column(Integer, nullable=True)
    content_html = Column(Text, nullable=True)
    detail_url = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ExternalNoticeFile(Base):
    __tablename__ = "external_notice_files"
    id = Column(Integer, primary_key=True)
    notice_id = Column(Integer, ForeignKey("external_notices.id"), nullable=False)

    attach_no = Column(String(50), nullable=False, unique=True)
    original_name = Column(String(255), nullable=False)
    source_url = Column(String(500), nullable=False)
    stored_name = Column(String(255), nullable=False)
    size = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Notice(Base):
    __tablename__ = "notices"
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    content_html = Column(Text, nullable=False)
    target_grade = Column(Integer, nullable=False, default=0)
    posted_date = Column(Date, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    source = Column(String(50), nullable=False, default="internal") 
    file_path = Column(String(500), nullable=True)
    original_filename = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    author = relationship("User", back_populates="notices")


# --- 4. FAQ 모델 ---
class FAQ(Base):
    __tablename__ = "faqs"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String(255), nullable=False)
    answer_html = Column(Text, nullable=False)
    posted_date = Column(Date, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_path = Column(String(500), nullable=True)
    original_filename = Column(String(255), nullable=True)
    category = Column(String(50), nullable=False, default="기타")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# --- 5. 공결 신청 모델 (Absence) ---
class AbsenceRequest(Base):
    __tablename__ = "absence_requests"
    id = Column(Integer, primary_key=True)
    
    # ★ 수정: DB에 이미 student_id로 만들어졌을 것이므로 student_id로 되돌림
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False) 

    course_name = Column(String(200), nullable=False)
    absent_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)

    status = Column(String(20), nullable=False, default="SUBMITTED")
    reject_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="absence_requests")
    attachments = relationship("AbsenceAttachment", backref="request")

class AbsenceAttachment(Base):
    __tablename__ = "absence_attachments"
    id = Column(Integer, primary_key=True)
    request_id = Column(Integer, ForeignKey("absence_requests.id"), nullable=False)
    original_name = Column(String(255), nullable=False)
    stored_name = Column(String(255), nullable=False)
    mime = Column(String(100), nullable=True)
    size = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AbsenceHistory(Base):
    __tablename__ = "absence_history"
    id = Column(Integer, primary_key=True)
    request_id = Column(Integer, ForeignKey("absence_requests.id"), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False)
    detail = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# --- 6. 인수인계 및 학사일정 등 나머지 모델 ---
class HandoverNote(Base):
    __tablename__ = "handover_notes"
    id = Column(Integer, primary_key=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    priority = Column(Integer, nullable=False, default=3)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class HandoverEvent(Base):
    __tablename__ = "handover_events"
    id = Column(Integer, primary_key=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True), nullable=False)
    location = Column(String(200), nullable=True)
    memo = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AcademicEvent(Base):
    __tablename__ = "academic_events"
    id = Column(Integer, primary_key=True)
    source = Column(String(50), nullable=False, default="sch_academic_calendar")
    year = Column(Integer, nullable=False)
    title = Column(Text, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    source_key = Column(String(200), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class CalendarMemo(Base):
    __tablename__ = "calendar_memos"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id")) 
    memo_date = Column(Date)
    content = Column(String(255))
    owner = relationship("User", back_populates="memos")