"""
Claude API를 사용하여 학사 행정 Q&A 학습 데이터를 생성하는 스크립트.

사용법:
    ANTHROPIC_API_KEY=... python generate_qa.py --category 수강신청 --count 50
    python generate_qa.py --all --count 30  # 모든 카테고리에서 각 30개 생성

생성된 데이터는 raw/ 디렉토리에 저장되며, 검수 후 processed/train.jsonl로 이동.
"""

import os
import json
import argparse
import time
from pathlib import Path
import anthropic

# 학사 행정 문의 카테고리 정의
CATEGORIES = {
    "수강신청": {
        "label": 0,
        "description": "수강신청 기간, 정정, 취소, 대기, 인원 초과 등",
        "examples": ["수강신청 기간이 언제인가요?", "수강신청 취소는 언제까지 가능한가요?"]
    },
    "성적": {
        "label": 1,
        "description": "성적 조회, 이의신청, GPA 계산, 성적증명서 등",
        "examples": ["성적 이의신청 기간은 언제인가요?", "GPA는 어떻게 계산되나요?"]
    },
    "졸업": {
        "label": 2,
        "description": "졸업 요건, 졸업논문, 졸업예정자 신청, 학위수여식 등",
        "examples": ["졸업 학점 요건이 어떻게 되나요?", "졸업논문 제출 기간이 언제인가요?"]
    },
    "장학금": {
        "label": 3,
        "description": "교내외 장학금, 신청 기간, 자격 요건, 유지 기준 등",
        "examples": ["국가장학금 신청 기간이 언제인가요?", "성적 장학금 기준이 어떻게 되나요?"]
    },
    "휴복학": {
        "label": 4,
        "description": "휴학 신청, 복학 신청, 군휴학, 휴학 기간 등",
        "examples": ["휴학 신청은 어떻게 하나요?", "군휴학 신청 기간이 언제인가요?"]
    },
    "등록금": {
        "label": 5,
        "description": "등록금 납부, 분할납부, 환불, 납부 기간 등",
        "examples": ["등록금 납부 기간이 언제인가요?", "등록금 분할납부 신청은 어떻게 하나요?"]
    },
    "기숙사": {
        "label": 6,
        "description": "기숙사 입사 신청, 퇴사, 생활 규정, 대기 등",
        "examples": ["기숙사 입사 신청 기간이 언제인가요?", "기숙사 대기 순번은 어떻게 확인하나요?"]
    },
    "공결_출석": {
        "label": 7,
        "description": "공결 처리, 출석 인정, 결석 기준, 공결 신청 방법 등",
        "examples": ["공결 신청은 어떻게 하나요?", "결석 몇 번이면 F인가요?"]
    },
    "증명서": {
        "label": 8,
        "description": "재학증명서, 성적증명서, 졸업증명서, 발급 방법 등",
        "examples": ["재학증명서는 어떻게 발급받나요?", "영문 성적증명서 발급 가능한가요?"]
    },
    "기타": {
        "label": 9,
        "description": "학적 변경, 전과, 부전공, 복수전공, 기타 행정 문의",
        "examples": ["전과 신청은 어떻게 하나요?", "부전공 신청 기간이 언제인가요?"]
    }
}

SYSTEM_PROMPT = """당신은 대학교 학사 행정 Q&A 데이터셋을 생성하는 전문가입니다.
학생들이 실제로 학사지원팀에 문의할 법한 질문과 담당자의 답변 쌍을 생성해주세요.

규칙:
- 질문은 학생 입장에서 자연스럽고 다양한 표현으로 작성
- 답변은 담당자가 정확하고 친절하게 안내하는 형식
- 각 Q&A는 완결된 정보를 담아야 함
- 반드시 JSON 배열 형식으로 출력"""

def generate_qa_for_category(client: anthropic.Anthropic, category: str, count: int) -> list[dict]:
    """특정 카테고리에 대한 Q&A 쌍 생성."""
    cat_info = CATEGORIES[category]

    prompt = f"""카테고리: {category}
설명: {cat_info['description']}
예시 질문: {', '.join(cat_info['examples'])}

위 카테고리에 해당하는 학사 행정 Q&A 데이터를 {count}개 생성해주세요.

다음 JSON 배열 형식으로 출력하세요:
[
  {{
    "question": "학생의 질문",
    "answer": "학사 담당자의 답변",
    "category": "{category}",
    "label": {cat_info['label']}
  }},
  ...
]"""

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )

    response_text = message.content[0].text.strip()
    # JSON 배열 추출
    start = response_text.find('[')
    end = response_text.rfind(']') + 1
    json_str = response_text[start:end]
    return json.loads(json_str)


def save_raw(data: list[dict], category: str):
    """raw 디렉토리에 카테고리별 JSON 파일로 저장."""
    output_path = Path(__file__).parent / "raw" / f"{category}.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[저장] {output_path} ({len(data)}개)")


def main():
    parser = argparse.ArgumentParser(description="Claude API로 학사 행정 Q&A 학습 데이터 생성")
    parser.add_argument("--category", type=str, choices=list(CATEGORIES.keys()), help="생성할 카테고리")
    parser.add_argument("--all", action="store_true", help="모든 카테고리 생성")
    parser.add_argument("--count", type=int, default=50, help="카테고리당 생성할 Q&A 수 (기본: 50)")
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY 환경변수를 설정해주세요.")

    client = anthropic.Anthropic(api_key=api_key)

    if args.all:
        targets = list(CATEGORIES.keys())
    elif args.category:
        targets = [args.category]
    else:
        parser.print_help()
        return

    for category in targets:
        print(f"\n[생성 중] 카테고리: {category}, 수량: {args.count}개")
        try:
            qa_data = generate_qa_for_category(client, category, args.count)
            save_raw(qa_data, category)
        except Exception as e:
            print(f"[오류] {category}: {e}")
        # API 레이트 리밋 방지
        time.sleep(2)

    print("\n완료! raw/ 디렉토리의 파일을 검수 후 processed/train.jsonl로 병합하세요.")
    print("병합 명령: python merge_and_split.py")


if __name__ == "__main__":
    main()
