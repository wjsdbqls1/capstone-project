"""AI 컨테이너가 뜬 직후 모델을 미리 불러 둔다.

AI 서버는 첫 요청이 올 때 모델을 읽는데(router.py의 lru_cache), N95 CPU에서 30초 넘게 걸린다.
그대로 두면 재시작·새벽 자동 재부팅 뒤 처음 문의를 연 조교가 그만큼 기다린다.
서버가 응답하기 시작하면 답변 추천·하이라이트를 한 번씩 불러 모델을 메모리에 올린다.
"""
import json
import time
import urllib.request

BASE = "http://127.0.0.1:7860"
BODY = json.dumps({"question": "수강신청 정정 기간이 언제인가요"}).encode()

for _ in range(120):  # 서버가 뜰 때까지 최대 2분 기다린다
    try:
        urllib.request.urlopen(BASE + "/", timeout=2)
        break
    except Exception:
        time.sleep(1)

for path in ("/api/ai/predict", "/api/ai/highlight"):
    start = time.time()
    try:
        req = urllib.request.Request(BASE + path, data=BODY, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=300).read()
        print(f"[warmup] {path} 준비 완료 ({time.time() - start:.1f}초)", flush=True)
    except Exception as e:
        print(f"[warmup] {path} 실패: {e}", flush=True)
