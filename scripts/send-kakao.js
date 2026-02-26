#!/usr/bin/env node
/**
 * 카카오톡 "나에게 보내기" 스크립트
 *
 * 사용법:
 * 1. .env 파일에 토큰 설정 완료
 * 2. 전송할 메시지 준비
 * 3. node send-kakao.js [메시지 파일 경로]
 */

import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env 로드
dotenv.config({ path: join(__dirname, '..', '.env') });

const ACCESS_TOKEN = process.env.KAKAO_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ Error: KAKAO_ACCESS_TOKEN not found in .env file');
  console.log('\n📝 Please run get-kakao-token.js first:');
  console.log('   node get-kakao-token.js');
  process.exit(1);
}

/**
 * 카카오톡으로 메시지 전송
 * @param {string} message - 전송할 메시지
 * @returns {Promise<object>} - 전송 결과
 */
async function sendKakaoMessage(message) {
  const MAX_LENGTH = 2000; // 카카오톡 메시지 최대 길이

  // 메시지 길이 제한
  let truncatedMessage = message;
  if (message.length > MAX_LENGTH) {
    truncatedMessage = message.substring(0, MAX_LENGTH - 50) + '\n\n... (내용이 길어 생략되었습니다)';
  }

  try {
    const response = await axios.post(
      'https://kapi.kakao.com/v2/api/talk/memo/default/send',
      {
        template_object: JSON.stringify({
          object_type: 'text',
          text: truncatedMessage,
          link: {
            web_url: 'https://news.naver.com/main/main.naver?mode=LSD&mid=shm&sid1=101',
            mobile_web_url: 'https://news.naver.com/main/main.naver?mode=LSD&mid=shm&sid1=101'
          }
        })
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    // 토큰 만료 에러 처리
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Access Token이 만료되었습니다. get-kakao-token.js를 다시 실행하세요.'
      };
    }

    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  let message;

  // 인자로 파일 경로가 주어진 경우
  if (process.argv[2]) {
    const filePath = process.argv[2];

    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    message = fs.readFileSync(filePath, 'utf8');
  }
  // stdin에서 읽기
  else if (!process.stdin.isTTY) {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    message = Buffer.concat(chunks).toString('utf8');
  }
  // 기본 테스트 메시지
  else {
    message = `📰 Morning Briefing Test\n\n이것은 테스트 메시지입니다.\n\n전송 시간: ${new Date().toLocaleString('ko-KR')}`;
  }

  console.log('📤 메시지 전송 중...\n');

  const result = await sendKakaoMessage(message);

  if (result.success) {
    console.log('✅ 메시지가 성공적으로 전송되었습니다!');
    console.log(`📱 카카오톡에서 확인하세요.\n`);
    process.exit(0);
  } else {
    console.error('❌ 메시지 전송 실패');

    if (result.error === 'TOKEN_EXPIRED') {
      console.error('\n🔄 토큰이 만료되었습니다.');
      console.error('아래 명령어를 실행하여 토큰을 재발급하세요:\n');
      console.error('  node get-kakao-token.js\n');
    } else {
      console.error('\nError:', JSON.stringify(result.error, null, 2));
    }

    process.exit(1);
  }
}

// 스크립트 실행
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
