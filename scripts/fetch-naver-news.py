#!/usr/bin/env python3
"""
네이버 경제 뉴스 RSS 수집 스크립트
"""

import sys
import json
import xml.etree.ElementTree as ET
from urllib.request import urlopen
from datetime import datetime

def fetch_naver_economy_news(limit=10):
    """
    네이버 경제 뉴스 RSS에서 최신 기사를 수집

    Args:
        limit: 수집할 기사 개수 (기본값: 10)

    Returns:
        dict: 뉴스 기사 목록과 메타데이터
    """
    rss_url = "https://news.naver.com/main/rss/section.naver?sid=101"

    try:
        # RSS 피드 가져오기
        with urlopen(rss_url, timeout=10) as response:
            rss_content = response.read()

        # XML 파싱
        root = ET.fromstring(rss_content)

        articles = []

        # RSS item 파싱
        for item in root.findall('.//item')[:limit]:
            title = item.find('title').text if item.find('title') is not None else ""
            link = item.find('link').text if item.find('link') is not None else ""
            description = item.find('description').text if item.find('description') is not None else ""
            pub_date = item.find('pubDate').text if item.find('pubDate') is not None else ""

            # HTML 태그 제거 (description에 포함될 수 있음)
            import re
            description = re.sub('<[^<]+?>', '', description)

            articles.append({
                'title': title.strip(),
                'link': link.strip(),
                'description': description.strip(),
                'pubDate': pub_date.strip()
            })

        result = {
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'source': '네이버 경제 뉴스',
            'rss_url': rss_url,
            'count': len(articles),
            'articles': articles
        }

        return result

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

def main():
    """메인 실행 함수"""
    # 인자로 개수 받기 (기본값: 10)
    limit = 10
    if len(sys.argv) > 1:
        try:
            limit = int(sys.argv[1])
        except ValueError:
            print("Warning: Invalid limit value, using default (10)", file=sys.stderr)

    # 뉴스 수집
    result = fetch_naver_economy_news(limit)

    # JSON 형태로 출력
    print(json.dumps(result, ensure_ascii=False, indent=2))

    # 에러 시 exit code 1
    if not result.get('success', False):
        sys.exit(1)

if __name__ == '__main__':
    main()
