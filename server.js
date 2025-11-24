const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// 기본 라우트 - 홈 페이지
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

// API 상태 확인
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
    });
});

// 404 처리
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'home.html'));
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 TimeBridge server running on port ${PORT}`);
    console.log(`📱 Access at: http://localhost:${PORT}`);
});

// 에러 핸들링
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

