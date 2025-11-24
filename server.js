const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 정적 파일 제공
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use('/config', express.static(path.join(__dirname, 'config')));

// 기본 라우트 - 홈 페이지
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/home.html'));
});

// 각 페이지 라우트
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/login.html'));
});

app.get('/new-entry', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/new_entry.html'));
});

app.get('/view-entry', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/view_entry.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/profile.html'));
});

// API 상태 확인
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
    });
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 처리
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views/home.html'));
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 TimeBridge server running on port ${PORT}`);
    console.log(`📱 Access at: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
});

// 에러 핸들링
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

