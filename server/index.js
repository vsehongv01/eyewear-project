const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

const pool = require('./db');

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

app.get('/main', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/main.html'));
});

app.get('/lensrange', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/lensrange.html'));
});

// 구글 시트 데이터 API
app.get('/api/lens-data', async (req, res) => {
  try {
    const sheetName = encodeURIComponent('테스트DB');
    const url = `https://docs.google.com/spreadsheets/d/1RMZ1KSPqUyjt7tX7R-ZlJORMkhCr1_pVrK6Vv5CqI1M/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`구글 시트 응답 오류: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    
    const rows = text.trim().split('\n').map(r => r.split(','));
    if (rows.length === 0) {
      throw new Error('구글 시트에서 데이터를 가져올 수 없습니다.');
    }
    
    const headers = rows.shift();
    
    const data = rows.map(row => Object.fromEntries(row.map((val, i) => [headers[i], val])));
    
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

app.post('/signup', async (req, res) => {
  const { name, email, password, role, license } = req.body;

  try {
    // 이메일 중복 체크
    const [existingUser] = await pool.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: '이미 사용 중인 이메일입니다.' });
    }

    // role 값 검증
    if (!['optician', 'customer'].includes(role)) {
      return res.status(400).json({ success: false, message: '올바르지 않은 역할입니다.' });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO users (name, email, password, role, license_number) VALUES (?, ?, ?, ?, ?)';
    const values = [name, email, hashedPassword, role, role === 'optician' ? license : null];

    const [results] = await pool.promise().query(sql, values);

    res.json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: { name, email, role }
    });
  } catch (err) {
    console.error('회원가입 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const [users] = await pool.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 일치하지 않습니다.' });
    }

    const user = users[0];
    
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 일치하지 않습니다.' });
    }

    res.json({
      success: true,
      message: '로그인이 완료되었습니다.',
      user: { 
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('로그인 오류 상세:', err);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

app.listen(port, () => {
  console.log(`서버 실행 중: http://localhost:${port}`);
});
