#!/bin/bash

# Morning Briefing 자동 실행 스크립트
# Mac용 - 매일 아침 cron으로 자동 실행됩니다

SKILL_DIR="/Users/sol/Desktop/sol/claude/.claude/skills/morning-briefing"
SCRIPTS_DIR="$SKILL_DIR/scripts"
OUTPUT_FILE="$SKILL_DIR/latest-briefing.md"
LOG_FILE="$SKILL_DIR/briefing.log"

# 로그 시작
echo "=== Morning Briefing Started at $(date) ===" >> "$LOG_FILE"

# 1. 네이버 뉴스 수집
echo "1. Fetching news..." >> "$LOG_FILE"
NEWS_DATA=$(python3 "$SCRIPTS_DIR/fetch-naver-news.py" 2>&1)

if [ $? -ne 0 ]; then
  echo "Error: News fetch failed" >> "$LOG_FILE"
  echo "$NEWS_DATA" >> "$LOG_FILE"
  exit 1
fi

echo "   ✅ News fetched successfully" >> "$LOG_FILE"

# 2. 요약 생성 및 포맷팅
echo "2. Generating briefing..." >> "$LOG_FILE"

echo "📰 오늘의 경제 뉴스 브리핑" > "$OUTPUT_FILE"
echo "생성 시간: $(date '+%Y-%m-%d %H:%M')" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# JSON 파싱하여 마크다운으로 변환
echo "$NEWS_DATA" | python3 -c "
import sys, json

try:
    data = json.load(sys.stdin)

    if not data.get('success'):
        print('뉴스 수집에 실패했습니다.')
        sys.exit(1)

    articles = data.get('articles', [])

    print(f'📊 수집된 기사: {len(articles)}개')
    print()
    print('📌 주요 뉴스:')
    print()

    for idx, article in enumerate(articles[:5], 1):
        title = article.get('title', '제목 없음')
        desc = article.get('description', '')
        link = article.get('link', '')

        print(f'{idx}. {title}')

        if desc:
            # 설명이 너무 길면 잘라내기
            if len(desc) > 150:
                desc = desc[:150] + '...'
            print(f'   {desc}')

        print(f'   🔗 {link}')
        print()

    print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    print()
    print('💡 더 많은 뉴스: https://news.naver.com/main/main.naver?mode=LSD&mid=shm&sid1=101')

except json.JSONDecodeError:
    print('JSON 파싱 오류')
    sys.exit(1)
except Exception as e:
    print(f'오류 발생: {e}')
    sys.exit(1)
" >> "$OUTPUT_FILE"

if [ $? -ne 0 ]; then
  echo "   ❌ Briefing generation failed" >> "$LOG_FILE"
  exit 1
fi

echo "   ✅ Briefing generated" >> "$LOG_FILE"

# 3. 카카오톡 전송
echo "3. Sending to KakaoTalk..." >> "$LOG_FILE"

cd "$SCRIPTS_DIR"
cat "$OUTPUT_FILE" | node send-kakao.js >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
  echo "   ✅ Message sent successfully!" >> "$LOG_FILE"
else
  echo "   ❌ Failed to send message" >> "$LOG_FILE"
  echo "   💡 Tip: Check if KAKAO_ACCESS_TOKEN is valid" >> "$LOG_FILE"
fi

echo "=== Completed at $(date) ===" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
