#!/usr/bin/env node
/**
 * 카카오 Access Token 발급 스크립트
 *
 * 사용법:
 * 1. .env 파일에 KAKAO_REST_API_KEY 설정
 * 2. node get-kakao-token.js 실행
 * 3. 브라우저에서 인증 후 토큰 복사
 */

import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env 로드
dotenv.config({ path: join(__dirname, '..', '.env') });

const REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const REDIRECT_URI = 'http://localhost:3000/callback';

if (!REST_API_KEY) {
  console.error('❌ Error: KAKAO_REST_API_KEY not found in .env file');
  console.log('\n📝 Please create .env file with:');
  console.log('KAKAO_REST_API_KEY=your_rest_api_key');
  process.exit(1);
}

const app = express();

// 루트 페이지 - 인증 시작
app.get('/', (req, res) => {
  const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>카카오 토큰 발급</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
        }
        h1 { color: #FEE500; }
        .button {
          display: inline-block;
          background-color: #FEE500;
          color: #000;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
        }
        .button:hover { background-color: #FDD835; }
      </style>
    </head>
    <body>
      <h1>🔐 카카오 Access Token 발급</h1>
      <p>아래 버튼을 클릭하여 카카오 로그인을 진행하세요.</p>
      <a href="${authUrl}" class="button">카카오 로그인</a>
      <hr>
      <p><small>로그인 후 자동으로 토큰이 발급됩니다.</small></p>
    </body>
    </html>
  `);
});

// 콜백 - 인증 코드로 토큰 발급
app.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    res.send('❌ Authorization code not found');
    return;
  }

  try {
    // Access Token 요청
    const tokenResponse = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: REST_API_KEY,
        redirect_uri: REDIRECT_URI,
        code: code
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // .env 파일 업데이트
    const envPath = join(__dirname, '..', '.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // 기존 토큰 정보 제거
    envContent = envContent.replace(/KAKAO_ACCESS_TOKEN=.*/g, '');
    envContent = envContent.replace(/KAKAO_REFRESH_TOKEN=.*/g, '');
    envContent = envContent.replace(/\n\n+/g, '\n\n');

    // 새 토큰 추가
    envContent += `\n# Kakao Tokens (Generated: ${new Date().toISOString()})\n`;
    envContent += `KAKAO_ACCESS_TOKEN=${access_token}\n`;
    envContent += `KAKAO_REFRESH_TOKEN=${refresh_token}\n`;

    fs.writeFileSync(envPath, envContent.trim() + '\n');

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>토큰 발급 완료</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
          }
          h1 { color: #28a745; }
          .token-box {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            word-break: break-all;
            margin: 10px 0;
          }
          .success { color: #28a745; }
        </style>
      </head>
      <body>
        <h1>✅ 토큰 발급 완료!</h1>
        <p>Access Token이 .env 파일에 저장되었습니다.</p>

        <h3>Access Token:</h3>
        <div class="token-box">${access_token}</div>

        <h3>만료 시간:</h3>
        <p>${expires_in / 3600}시간 후</p>

        <p class="success">✅ .env 파일이 자동으로 업데이트되었습니다.</p>
        <p>이제 이 창을 닫고 터미널로 돌아가세요.</p>

        <hr>
        <p><small>💡 Tip: 토큰이 만료되면 이 스크립트를 다시 실행하세요.</small></p>
      </body>
      </html>
    `);

    console.log('\n✅ Access Token이 .env 파일에 저장되었습니다!');
    console.log(`만료 시간: ${expires_in / 3600}시간 후\n`);

    // 5초 후 서버 종료
    setTimeout(() => {
      console.log('서버를 종료합니다...');
      process.exit(0);
    }, 5000);

  } catch (error) {
    console.error('❌ Token request failed:', error.response?.data || error.message);
    res.send(`
      <h1>❌ 토큰 발급 실패</h1>
      <pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>
    `);
  }
});

// 서버 시작
const PORT = 3000;
app.listen(PORT, () => {
  console.log('\n🚀 카카오 토큰 발급 서버가 시작되었습니다!');
  console.log(`\n📍 브라우저에서 아래 URL을 열어주세요:`);
  console.log(`   http://localhost:${PORT}\n`);
  console.log('⏳ 인증 완료를 기다리는 중...\n');
});
