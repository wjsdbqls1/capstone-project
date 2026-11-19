# backend/login_guard.py
"""로그인 비밀번호 대입을 막는 실패 횟수 제한.

예전에는 접속 IP 하나당 1분에 로그인 10번(성공 포함)으로 막았다. 그런데 학교 와이파이는
교내 전원이 같은 공인 IP로 나가서, 몇 명이 비밀번호를 틀리면 교내 전원이 함께 막혔다.
그래서 **실패만** 세고, 기준을 둘로 나눈다.

- 같은 IP + 같은 아이디: 1분에 10번 실패하면 그 아이디만 1분간 막는다(한 계정 비밀번호 대입).
- 같은 IP 전체: 1분에 30번 실패하면 그 IP를 1분간 막는다(여러 학번에 초기 비밀번호를
  돌려 넣는 공격 대비). 정상 사용자의 실패가 교내에서 1분에 30번 몰리는 일은 드물다.

성공한 로그인은 세지 않으므로, 수업 중에 학생들이 한꺼번에 로그인해도 막히지 않는다.
서버 프로세스 메모리에만 두므로 재시작하면 초기화된다(백엔드는 프로세스 1개로 돈다).
"""
import threading
import time
from collections import deque

WINDOW_SEC = 60
MAX_FAILS_PER_ACCOUNT = 10
MAX_FAILS_PER_IP = 30
BLOCK_MESSAGE = "로그인 시도가 너무 많습니다. 1분 뒤에 다시 시도해 주세요."

_fails: dict[str, deque] = {}
_lock = threading.Lock()


def _count(key: str, now: float) -> int:
    q = _fails.get(key)
    if not q:
        return 0
    while q and q[0] <= now - WINDOW_SEC:
        q.popleft()
    if not q:
        del _fails[key]
        return 0
    return len(q)


def _keys(ip: str, account: str) -> tuple[str, str]:
    return f"acct:{ip}:{(account or '').strip().lower()}", f"ip:{ip}"


def is_blocked(ip: str, account: str) -> bool:
    acct_key, ip_key = _keys(ip, account)
    now = time.monotonic()
    with _lock:
        return _count(acct_key, now) >= MAX_FAILS_PER_ACCOUNT or _count(ip_key, now) >= MAX_FAILS_PER_IP


def record_failure(ip: str, account: str) -> None:
    now = time.monotonic()
    with _lock:
        # 오래 안 쓰인 기록이 쌓이지 않게 가끔 통째로 정리한다
        if len(_fails) > 10_000:
            for k in list(_fails):
                _count(k, now)
        for key in _keys(ip, account):
            _fails.setdefault(key, deque()).append(now)


def reset() -> None:
    """테스트용."""
    with _lock:
        _fails.clear()
