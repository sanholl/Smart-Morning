# Smart Morning

매일 아침 약속한 시간에, 네이버 경제 뉴스를 자동으로 수집하고 요약하여 카카오톡으로 받는 자동화 시스템입니다.

## 📋 목차

- [기능 소개](#기능-소개)
- [빠른 시작](#빠른-시작)
- [상세 설정 가이드](#상세-설정-가이드)
- [사용 방법](#사용-방법)
- [자동 스케줄링](#자동-스케줄링)
- [트러블슈팅](#트러블슈팅)

## 🎯 기능 소개

1. **네이버 경제 뉴스 수집** - Python으로 RSS 파싱
2. **AI 요약** - Claude가 핵심 소식만 선별하여 요약
3. **카카오톡 전송** - 나에게 보내기 API로 자동 전송
4. **자동 스케줄링** - Mac cron으로 매일 아침 자동 실행

## 🚀 빠른 시작

### 1단계: 기본 설정

```bash
# 프로젝트 디렉토리로 이동
cd /Users/sol/Desktop/sol/claude/.claude/skills/morning-briefing

# Node.js 패키지 설치
cd scripts
npm install

# .env 파일 생성
cp .env.example ../.env
```

### 2단계: 카카오 개발자 설정

1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. **애플리케이션 추가하기** 클릭
3. 앱 이름 입력 (예: "Morning Briefing")
4. **앱 설정 > 요약 정보**에서 **REST API 키** 복사
5. `.env` 파일에 REST API 키 입력:
   ```
   KAKAO_REST_API_KEY=복사한_키_여기에_붙여넣기
   ```

### 3단계: 카카오 로그인 활성화

1. **제품 설정 > 카카오 로그인** 메뉴로 이동
2. **활성화 설정** → **ON** 으로 변경
3. **Redirect URI 등록** 클릭
4. `http://localhost:3000/callback` 입력 후 저장
5. **동의 항목** 메뉴로 이동
6. "카카오톡 메시지 전송" 권한 설정

### 4단계: Access Token 발급

```bash
cd scripts
node get-kakao-token.js
```

브라우저가 자동으로 열리고, 카카오 로그인 후 토큰이 자동으로 `.env` 파일에 저장됩니다.

### 5단계: 테스트 실행

```bash
# 네이버 뉴스 수집 테스트
python3 fetch-naver-news.py

# 카카오톡 전송 테스트
node send-kakao.js
```

성공하면 카카오톡에 테스트 메시지가 도착합니다! 🎉

## 📖 상세 설정 가이드

### Python 환경 설정 (선택사항)

Python 3.6 이상이 필요합니다. Mac에는 기본적으로 설치되어 있습니다.

```bash
# Python 버전 확인
python3 --version

# 필요시 pip 업그레이드
python3 -m pip install --upgrade pip
```

### Node.js 환경 설정 (선택사항)

Node.js 14 이상이 필요합니다.

```bash
# Node.js 버전 확인
node --version

# Homebrew로 설치 (없는 경우)
brew install node
```

### 카카오 REST API 키 확인

1. [카카오 개발자](https://developers.kakao.com/console/app) → 내 애플리케이션
2. 앱 선택 → **앱 설정** → **요약 정보**
3. **REST API 키** 복사

### Access Token 재발급

토큰은 보통 6시간 후 만료됩니다. 만료 시 재발급:

```bash
cd scripts
node get-kakao-token.js
```

## 💡 사용 방법

### 방법 1: Claude Code에서 실행

```
/morning-briefing
```

스킬이 자동으로:
1. 네이버 뉴스 수집
2. 주요 소식 요약
3. 카카오톡 전송

### 방법 2: 터미널에서 수동 실행

```bash
# 프로젝트 루트로 이동
cd /Users/sol/Desktop/sol/claude

# 스킬 실행
claude skill run morning-briefing
```

### 방법 3: 개별 스크립트 실행

```bash
cd .claude/skills/morning-briefing/scripts

# 1. 뉴스 수집
python3 fetch-naver-news.py > news.json

# 2. 요약 생성 (Claude에게 요청)
# 3. 카카오톡 전송
echo "요약된 메시지" | node send-kakao.js
```

## ⏰ 자동 스케줄링

### Mac cron 설정

매일 아침 9시에 자동 실행되도록 설정합니다.

#### 1단계: 실행 스크립트 생성

```bash
# 실행 스크립트 생성
cd /Users/sol/Desktop/sol/claude/.claude/skills/morning-briefing
nano run-briefing.sh
```

다음 내용 입력:

```bash
#!/bin/bash

# Morning Briefing 자동 실행 스크립트
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

# 2. 요약 생성 (Claude API 사용)
# TODO: Claude API를 호출하여 요약 생성
# 현재는 간단한 형식으로 저장
echo "📰 오늘의 경제 뉴스 ($(date +%Y-%m-%d))" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "$NEWS_DATA" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('success'):
    print(f\"📊 수집: {data['count']}개 기사\n\")
    for idx, article in enumerate(data['articles'][:5], 1):
        print(f\"{idx}. {article['title']}\")
        print(f\"   {article['description'][:100]}...\")
        print(f\"   🔗 {article['link']}\n\")
" >> "$OUTPUT_FILE"

# 3. 카카오톡 전송
echo "2. Sending to KakaoTalk..." >> "$LOG_FILE"
cat "$OUTPUT_FILE" | node "$SCRIPTS_DIR/send-kakao.js" >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Success!" >> "$LOG_FILE"
else
  echo "❌ Failed to send message" >> "$LOG_FILE"
fi

echo "=== Completed at $(date) ===" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
```

실행 권한 부여:

```bash
chmod +x run-briefing.sh
```

#### 2단계: crontab 설정

```bash
# crontab 편집기 열기
crontab -e
```

다음 라인 추가 (매일 오전 9시):

```cron
# Morning Briefing - 매일 오전 9시
0 9 * * * /Users/sol/Desktop/sol/claude/.claude/skills/morning-briefing/run-briefing.sh
```

저장하고 종료 (`Esc` → `:wq` → `Enter`)

#### 3단계: cron 권한 설정 (Mac)

Mac의 경우 터미널에 Full Disk Access 권한이 필요할 수 있습니다:

1. **시스템 설정** → **개인정보 보호 및 보안** → **전체 디스크 접근 권한**
2. **터미널** 또는 **iTerm** 추가

#### 4단계: 동작 확인

```bash
# crontab 목록 확인
crontab -l

# 수동 테스트
/Users/sol/Desktop/sol/claude/.claude/skills/morning-briefing/run-briefing.sh

# 로그 확인
tail -f /Users/sol/Desktop/sol/claude/.claude/skills/morning-briefing/briefing.log
```

### cron 시간 변경

```cron
# 오전 7시
0 7 * * * /path/to/run-briefing.sh

# 오전 9시, 오후 6시 (2회)
0 9,18 * * * /path/to/run-briefing.sh

# 월~금요일 오전 8시 (주말 제외)
0 8 * * 1-5 /path/to/run-briefing.sh
```

## 🔧 트러블슈팅

### ❌ 카카오 토큰 만료

**증상**: "TOKEN_EXPIRED" 에러 메시지

**해결**:
```bash
cd scripts
node get-kakao-token.js
```

### ❌ 네이버 뉴스 수집 실패

**증상**: Python 스크립트 에러

**해결**:
```bash
# 네트워크 확인
curl -I https://news.naver.com/main/rss/section.naver?sid=101

# Python 3 설치 확인
python3 --version
```

### ❌ cron이 실행되지 않음

**증상**: 지정된 시간에 실행 안됨

**해결**:
1. cron 로그 확인:
   ```bash
   log show --predicate 'eventMessage contains "cron"' --last 1h --info
   ```

2. 스크립트 경로 확인:
   ```bash
   crontab -l
   ls -la /Users/sol/Desktop/sol/claude/.claude/skills/morning-briefing/run-briefing.sh
   ```

3. 수동 실행으로 스크립트 테스트:
   ```bash
   /Users/sol/Desktop/sol/claude/.claude/skills/morning-briefing/run-briefing.sh
   ```

### ❌ Node.js 모듈 없음

**증상**: "Cannot find module 'axios'" 에러

**해결**:
```bash
cd scripts
npm install
```

## 📂 파일 구조

```
.claude/skills/morning-briefing/
├── SKILL.md                    # 스킬 정의
├── README.md                   # 이 파일
├── .env                        # API 키 (gitignore 필수)
├── .env.example                # 환경 변수 예제
├── run-briefing.sh             # 자동 실행 스크립트
├── latest-briefing.md          # 최근 브리핑 내용
├── briefing.log                # 실행 로그
└── scripts/
    ├── package.json            # Node.js 의존성
    ├── fetch-naver-news.py     # 뉴스 수집 스크립트
    ├── get-kakao-token.js      # 토큰 발급 스크립트
    └── send-kakao.js           # 카카오톡 전송 스크립트
```

## 🔒 보안 주의사항

**절대 Git에 커밋하지 말 것**:
- `.env` 파일
- `*.log` 파일
- Access Token

`.gitignore`에 추가:
```gitignore
.env
*.log
latest-briefing.md
```

## 🎨 커스터마이징

### 뉴스 개수 변경

`fetch-naver-news.py` 실행 시 인자로 개수 지정:

```bash
python3 fetch-naver-news.py 20  # 20개 수집
```

### 요약 스타일 변경

`SKILL.md`의 "Step 2: 주요 소식 요약" 섹션을 수정하여 Claude에게 원하는 요약 스타일을 지시하세요.

### 다른 뉴스 소스 추가

새로운 Python 스크립트를 추가하거나 `fetch-naver-news.py`를 수정하여 다른 RSS 피드를 파싱하세요.

## 📚 참고 자료

- [카카오 개발자 - 메시지 API](https://developers.kakao.com/docs/latest/ko/message/rest-api)
- [네이버 뉴스 RSS](https://news.naver.com/main/list.naver?mode=LPOD&mid=sec&sid1=101)
- [cron 표현식 가이드](https://crontab.guru/)
- [Claude Code 공식 문서](https://docs.anthropic.com/claude-code)

## 🆘 도움이 필요하신가요?

문제가 해결되지 않으면:
1. `briefing.log` 파일 확인
2. 각 스크립트를 개별적으로 테스트
3. 카카오 개발자 콘솔에서 앱 설정 재확인

---

**Made with ❤️ using Claude Code**
