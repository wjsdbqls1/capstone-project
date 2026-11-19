# backend/rate_limit.py
import os

from slowapi import Limiter
from slowapi.util import get_remote_address

# 학과 서버는 모든 요청이 Cloudflare 터널(cloudflared)을 거쳐 들어와서, 그대로 두면
# 모든 사용자가 같은 IP로 보인다. 그러면 한 명이 로그인 횟수 제한에 걸릴 때 전원이 막힌다.
# Cloudflare는 실제 접속자 IP를 CF-Connecting-IP 헤더에 넣고, 사용자가 같은 헤더를 보내도
# 덮어쓰므로 위조할 수 없다. 다만 Cloudflare를 거치지 않는 환경(Render, 로컬)에서는
# 아무나 이 헤더를 지어낼 수 있으므로 TRUST_CF_CONNECTING_IP=1일 때만 믿는다.
_TRUST_CF = os.getenv("TRUST_CF_CONNECTING_IP") == "1"


def client_ip(request) -> str:
    if _TRUST_CF:
        ip = request.headers.get("cf-connecting-ip", "").strip()
        if ip:
            return ip
    return get_remote_address(request)


limiter = Limiter(key_func=client_ip)
