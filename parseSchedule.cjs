const fs = require('fs');

// period 번호를 시간으로 변환하는 헬퍼
const periodToTimeRange = (periods) => {
    const periodMap = {
        1: '08:00',
        2: '09:00',
        3: '10:00',
        4: '11:00',
        5: '12:00',
        6: '13:00',
        7: '14:00',
        8: '15:00',
        9: '16:00',
        10: '17:00',
        11: '18:00',
        12: '19:00',
        13: '20:00',
        14: '21:00',
    };

    const validPeriods = periods.map(Number).filter((p) => periodMap[p]);

    if (validPeriods.length === 0) return '시간 정보 없음';

    const sorted = validPeriods.sort((a, b) => a - b);
    const start = periodMap[sorted[0]];
    const endRaw = periodMap[sorted[sorted.length - 1]];

    if (!endRaw) return '시간 정보 없음';

    const endHour = parseInt(endRaw.split(':')[0]) + 1;
    const end = `${endHour.toString().padStart(2, '0')}:00`;

    return `${start}~${end}`;
};

// 메인 파싱 함수
function transformClassesByRoom(data) {
    const result = {};

    data.class.forEach((item) => {
        const entries = item.LECT_TIME_ROOM.match(
            /([월화수목금토일])[\d,]+\(.*?\)/g
        ); // 모든 수업 패턴 추출
        if (!entries) return;

        entries.forEach((entry) => {
            const match = entry.match(/([월화수목금토일])([\d,]+)\(([^)]+)\)/);
            if (!match) return;

            const [, day, periodStr, room] = match;
            const periods = periodStr.split(',').map(Number);
            const timeRange = periodToTimeRange(periods);

            if (!result[room]) result[room] = [];

            result[room].push({
                subject: item.SBJ_NM,
                professor: item.STAFF_NM,
                day,
                periods,
                time: timeRange,
                original: item,
            });
        });
    });

    return result;
}

// JSON 파일 읽기
const raw = fs.readFileSync('public/data/input.json', 'utf-8');
const json = JSON.parse(raw);

// 파싱 후 저장
const transformed = transformClassesByRoom(json);
fs.writeFileSync('output.json', JSON.stringify(transformed, null, 2));

console.log('✅ parsing 완료: output.json 생성됨');

module.exports = { transformClassesByRoom };
