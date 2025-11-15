import { HOLIDAYS } from './constants.js';

// 날짜 포맷팅 (YYYY-MM-DD (요일) 형식)
export function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = days[date.getDay()];

    return `${year}-${month}-${day} (${dayOfWeek})`;
}

// 날짜가 공휴일인지 확인
export function isHoliday(dateStr) {
    // YYYY-MM-DD (요일) 형식에서 YYYY-MM-DD만 추출
    const datePart = dateStr.split(' ')[0];
    return HOLIDAYS.hasOwnProperty(datePart);
}

// 공휴일 이름 가져오기
export function getHolidayName(dateStr) {
    const datePart = dateStr.split(' ')[0];
    return HOLIDAYS[datePart] || '';
}
