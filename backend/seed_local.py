# backend/seed_local.py
"""로컬 테스트용 계정과 문의 데이터를 만든다.

문의 3단계(대기중 / 진행중 / 완료)를 모두 눈으로 확인할 수 있도록
상태별 표본을 하나씩 깔아 둔다. 운영 DB에서는 절대 돌지 않도록 막아 두었다.

사용법:  python seed_local.py
"""
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "local_test.db").replace("\\", "/")

os.environ["DATABASE_URL"] = f"sqlite:///{DB_PATH}"
os.environ["SUPABASE_URL"] = ""
os.environ["SUPABASE_SERVICE_KEY"] = ""
os.environ["JWT_SECRET"] = "local-test-only-secret"
os.environ["VAPID_PRIVATE_KEY"] = ""

os.chdir(BASE_DIR)

from passlib.context import CryptContext  # noqa: E402

from db import Base, SessionLocal, engine  # noqa: E402
from models import Inquiry, InquiryReply, User  # noqa: E402

# 운영 DB 사고 방지 — SQLite가 아니면 아무것도 하지 않는다
assert os.environ["DATABASE_URL"].startswith("sqlite"), "로컬 SQLite에서만 실행할 수 있습니다."

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
PASSWORD = "test1234"

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# 다시 돌려도 같은 결과가 나오도록 기존 문의 데이터를 비운다
db.query(InquiryReply).delete()
db.query(Inquiry).delete()
db.commit()


def ensure_user(student_no, name, role, grade=None, department=None):
    u = db.query(User).filter(User.student_no == student_no).first()
    if not u:
        u = User(student_no=student_no, name=name, role=role)
        db.add(u)
    u.name = name
    u.role = role
    u.grade = grade
    u.department = department
    u.status = "재학"
    u.password_hash = pwd.hash(PASSWORD)
    u.must_change_password = False  # 테스트마다 비밀번호 변경 화면으로 튕기지 않도록
    return u


ta = ensure_user("ta001", "김조교", "assistant")
dev = ensure_user("dev001", "개발자", "admin")
s1 = ensure_user("20250001", "김하늘", "student", grade=3, department="컴퓨터소프트웨어공학과")
s2 = ensure_user("20250002", "박지훈", "student", grade=2, department="컴퓨터소프트웨어공학과")
db.commit()


def add_inquiry(user, title, content, status, messages=()):
    """messages: [(보낸사람 role, 내용), ...] 순서대로 대화가 쌓인다."""
    q = Inquiry(user_id=user.id, title=title, content=content, status=status)
    db.add(q)
    db.flush()  # id를 받아야 답변을 붙일 수 있다
    for role, text in messages:
        db.add(InquiryReply(
            inquiry_id=q.id,
            assistant_id=(ta.id if role == "assistant" else user.id),
            sender_role=role,
            content=text,
        ))
    return q


# 1) 대기중 — 아직 아무 답변이 없다
add_inquiry(
    s1, "계절학기 수강신청은 언제부터인가요?",
    "겨울 계절학기를 들으려고 하는데 신청 기간이 언제인지 궁금합니다.",
    "OPEN",
)

# 2) 진행중 — 조교가 답했고, 마지막 말도 조교 (조교가 기다릴 차례가 아님)
add_inquiry(
    s1, "졸업요건에서 봉사학습 학점이 빠진 것 같습니다",
    "성적표를 확인했는데 봉사학습 이수 내역이 보이지 않습니다. 확인 부탁드립니다.",
    "IN_PROGRESS",
    [("assistant", "확인해 보니 지난 학기 봉사 실적이 아직 반영 전입니다. 반영되면 다시 알려드리겠습니다.")],
)

# 3) 진행중 — 학생이 마지막으로 질문해서 조교가 답할 차례 (목록에 '학생 질문 대기' 표시)
add_inquiry(
    s2, "전과 신청 서류를 어디에 제출하나요?",
    "전과를 신청하려고 하는데 서류를 어디로 내야 하는지 알고 싶습니다.",
    "IN_PROGRESS",
    [
        ("assistant", "학과사무실에 제출하시면 됩니다. 신청 기간은 공지사항을 확인해 주세요."),
        ("student", "혹시 우편으로 보내도 되나요? 이번 주에 학교에 못 갑니다."),
    ],
)

# 4) 완료 — 조교가 완료 처리한 문의
add_inquiry(
    s2, "증명서 발급은 어디서 하나요?",
    "재학증명서가 필요한데 발급 방법을 알려주세요.",
    "COMPLETED",
    [("assistant", "학교 홈페이지 하단의 인터넷 증명발급 또는 교내 무인발급기에서 가능합니다.")],
)

db.commit()

print(f"로컬 DB 준비 완료: {DB_PATH}")
print(f"비밀번호는 모두 '{PASSWORD}'")
print("  조교    ta001")
print("  개발자  dev001")
print("  학생    20250001(김하늘) / 20250002(박지훈)")
print(f"문의 {db.query(Inquiry).count()}건, 답변 {db.query(InquiryReply).count()}건")
db.close()
