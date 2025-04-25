const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
const port = 3000;

// 미들웨어 설정
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// HTML 파일 서빙
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/signup.html'));
});

app.get('/lensrange', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/lensrange.html'));
});

// 구글 시트 데이터 API
app.get('/api/lens-data', async (req, res) => {
  try {
    const sheetName = encodeURIComponent('테스트DB');
    const url = `https://docs.google.com/spreadsheets/d/1RMZ1KSPqUyjt7tX7R-ZlJORMkhCr1_pVrK6Vv5CqI1M/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
    
    console.log('구글 시트 URL:', url);
    const response = await fetch(url);
    console.log('구글 시트 응답 상태:', response.status);
    
    if (!response.ok) {
      throw new Error(`구글 시트 응답 오류: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    console.log('구글 시트 응답 데이터:', text.substring(0, 200) + '...'); // 처음 200자만 로깅
    
    const rows = text.trim().split('\n').map(r => r.split(','));
    if (rows.length === 0) {
      throw new Error('구글 시트에서 데이터를 가져올 수 없습니다.');
    }
    
    const headers = rows.shift();
    console.log('구글 시트 헤더:', headers);
    
    const data = rows.map(row => Object.fromEntries(row.map((val, i) => [headers[i], val])));
    console.log('처리된 데이터 첫 번째 행:', data[0]);
    
    res.json(data);
  } catch (error) {
    console.error('구글 시트 데이터 가져오기 실패:', error);
    res.status(500).json({ 
      error: '데이터를 가져오는데 실패했습니다.',
      details: error.message 
    });
  }
});

// 정적 파일 서빙 (CSS, JS, 이미지 등)
app.use(express.static(path.join(__dirname, '../public')));

// 회원가입 처리
app.post('/signup', (req, res) => {
  const { name, email, password, role, license } = req.body;
  
  // TODO: 데이터베이스에 저장하는 로직 추가 예정
  console.log('가입된 정보:', { name, email, password, role, license });
  
  // 임시 응답
  res.json({
    success: true,
    message: '회원가입이 완료되었습니다.',
    user: { name, email, role, license }
  });
});

// 로그인 처리
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // TODO: 데이터베이스에서 사용자 확인 로직 추가 예정
  console.log('로그인 시도:', { email, password });
  
  // 임시 응답
  res.json({
    success: true,
    message: '로그인이 완료되었습니다.',
    user: { email }
  });
});

app.listen(port, () => {
  console.log(`서버 실행 중: http://localhost:${port}`);
});
