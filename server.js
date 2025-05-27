// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
const PORT = 3000;

// 현재 디렉토리 구하기 (ESM에서 필요)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const dayOrder = {
    월: 1,
    화: 2,
    수: 3,
    목: 4,
    금: 5,
    토: 6,
    일: 7,
};

function sortClassrooms(data) {
    return Object.fromEntries(
        Object.entries(data)
            .sort(([roomA], [roomB]) => {
                const getNumber = (room) =>
                    parseInt(room.match(/\d+/)?.[0] || '0');
                const getPrefix = (room) => room.match(/[A-Z]+/)?.[0] || '';

                const prefixA = getPrefix(roomA);
                const prefixB = getPrefix(roomB);
                const numA = getNumber(roomA);
                const numB = getNumber(roomB);

                if (prefixA !== prefixB) {
                    return prefixA.localeCompare(prefixB);
                }
                return numA - numB;
            })
            .map(([room, classes]) => [room, sortSchedules(classes)])
    );
}

function sortSchedules(classes) {
    return classes.sort((a, b) => {
        const dayDiff = dayOrder[a.day] - dayOrder[b.day];
        if (dayDiff !== 0) return dayDiff;

        const startA = parseInt(a.time?.split('~')[0]?.replace(':', '') || '0');
        const startB = parseInt(b.time?.split('~')[0]?.replace(':', '') || '0');
        return startA - startB;
    });
}

// ✅ 모든 도메인 허용
app.use(cors());

// 또는 특정 도메인만 허용하고 싶다면:
app.use(
    cors({
        origin: 'http://localhost:5173', // 또는 Vite/React 주소
        credentials: true, // 인증 정보(쿠키 등)를 포함할 경우
    })
);

// 정적 파일 제공 (React나 HTML 파일 + JSON 파일 포함)
app.use(express.static(path.join(__dirname, 'public')));

// 기본 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// output.json 불러오기
const data = JSON.parse(fs.readFileSync('./output.json', 'utf-8'));

// 개별 강의실 조회
app.get('/api/rooms/:room', (req, res) => {
    const room = req.params.room;
    console.log(`Fetching data for room: ${room}`);
    const result = data[room] || [];
    const sorted = sortSchedules(result);
    res.json(sorted);
});

// 쿼리로 강의실 prefix 조회
app.get('/api/classrooms', (req, res) => {
    const { room } = req.query;

    if (!room || typeof room !== 'string' || room.trim() === '') {
        const sorted = sortClassrooms(data); // 알파벳 + 숫자 정렬 포함된 함수
        return res.json(sorted);
    }

    const lowerRoom = room.toLowerCase();

    const matchedRooms = Object.keys(data).filter((key) =>
        key.toLowerCase().startsWith(lowerRoom)
    );

    const result = {};
    matchedRooms.forEach((roomKey) => {
        result[roomKey] = data[roomKey];
    });

    const sortedResult = sortClassrooms(result);
    res.json(sortedResult);
});

// 건물별 강의실 조회
app.get('/api/buildings/:building', (req, res) => {
    const building = req.params.building;
    const filtered = Object.entries(data).filter(([room]) =>
        room.startsWith(building)
    );

    const structured = Object.fromEntries(
        filtered.map(([room, classes]) => [room, sortSchedules(classes)])
    );

    const sortedResult = sortClassrooms(structured);
    res.json(sortedResult);
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`✅ Server listening on http://localhost:${PORT}`);
});
