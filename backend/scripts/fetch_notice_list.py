import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, parse_qs

BASE = "https://home.sch.ac.kr"
LIST_PATH = "/csw/05/01.jsp"
LIST_URL = BASE + LIST_PATH
BOARD_NO = "20211127173805974033"

def get_offset(u: str) -> int:
    qs = parse_qs(urlparse(u).query)
    v = (qs.get("pager.offset") or qs.get("pager offset") or ["0"])[0]
    try:
        return int(v)
    except ValueError:
        return 0

def parse_list_page(url: str):
    html = requests.get(url, timeout=10).text
    soup = BeautifulSoup(html, "html.parser")

    items = []
    for a in soup.select("table.type_board td.subject a"):
        href = a.get("href")
        if not href:
            continue
        detail_url = urljoin(LIST_URL, href)

        qs = parse_qs(urlparse(detail_url).query)
        article_no = (qs.get("article_no") or [None])[0]
        if not article_no:
            continue

        title = a.get_text(strip=True)
        items.append({"article_no": article_no, "title": title, "detail_url": detail_url})

    next_url = None
    a_next = soup.select_one(".board_page a.pager.next")
    if a_next and a_next.get("href"):
        next_url = urljoin(LIST_URL, a_next["href"])

    return items, next_url

start = f"{LIST_URL}?mode=list&board_no={BOARD_NO}&pager.offset=0"

all_items = []
seen = set()

url = start
cur_off = get_offset(url)
page = 0

while url:
    page += 1
    items, next_url = parse_list_page(url)

    for it in items:
        if it["article_no"] in seen:
            continue
        seen.add(it["article_no"])
        all_items.append(it)

    if not next_url:
        break

    next_off = get_offset(next_url)
    if next_off <= cur_off:
        break

    cur_off = next_off
    url = next_url

print("pages:", page)
print("total:", len(all_items))
for x in all_items[:10]:
    print(x)
