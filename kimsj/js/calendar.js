import { state, addSelectedDate, removeSelectedDate, changeMonth as changeStateMonth } from './state.js';
import { formatDate, getHolidayName } from './utils.js';

// 달력 생성
export function generateCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthDisplay = document.getElementById('currentMonth');

    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();

    // 월 표시
    currentMonthDisplay.textContent = `${year}년 ${month + 1}월`;

    // 달력 초기화
    calendarGrid.innerHTML = '';

    // 이번 달의 첫날과 마지막날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 첫날의 요일 (0: 일요일)
    const firstDayOfWeek = firstDay.getDay();

    // 빈 칸 추가
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDiv);
    }

    // 날짜 추가
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const dateStr = formatDate(date);

        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.dataset.date = dateStr;

        // 요일 확인 (0: 일요일, 6: 토요일)
        const dayOfWeek = date.getDay();

        // 공휴일인지 확인
        const holidayName = getHolidayName(dateStr);
        if (holidayName) {
            dayDiv.classList.add('holiday');
            dayDiv.innerHTML = `
                <div class="day-number">${day}</div>
                <div class="holiday-name">${holidayName}</div>
            `;
        } else {
            // 공휴일이 아닌 경우에만 주말 클래스 추가
            if (dayOfWeek === 0) {
                dayDiv.classList.add('sunday');
            } else if (dayOfWeek === 6) {
                dayDiv.classList.add('saturday');
            }
            dayDiv.textContent = day;
        }

        // 과거 날짜는 비활성화
        if (date < today) {
            dayDiv.classList.add('disabled');
        } else {
            dayDiv.onclick = function() {
                toggleDateSelection(dateStr, dayDiv);
            };

            // 이미 선택된 날짜인지 확인
            if (state.selectedDates.includes(dateStr)) {
                dayDiv.classList.add('selected');
            }
        }

        // 오늘 날짜 표시
        if (date.getTime() === today.getTime()) {
            dayDiv.classList.add('today');
        }

        calendarGrid.appendChild(dayDiv);

        // 투표 데이터 초기화
        if (!state.votes.hasOwnProperty(dateStr)) {
            state.votes[dateStr] = 0;
        }
    }
}

// 월 변경
export function changeMonth(delta) {
    changeStateMonth(delta);
    generateCalendar();
}

// 날짜 선택/해제 토글
export function toggleDateSelection(dateStr, element) {
    const index = state.selectedDates.indexOf(dateStr);

    if (index === -1) {
        // 선택 추가
        addSelectedDate(dateStr);
        element.classList.add('selected');
    } else {
        // 선택 해제
        removeSelectedDate(dateStr);
        element.classList.remove('selected');
    }

    // 선택된 날짜 표시 업데이트
    updateSelectedDatesDisplay();
}

// 선택된 날짜 표시 업데이트
export function updateSelectedDatesDisplay() {
    const display = document.getElementById('selectedDatesDisplay');

    if (state.selectedDates.length === 0) {
        display.textContent = '선택된 날짜가 없습니다';
        display.className = 'selected-dates-display empty';
    } else {
        display.textContent = `선택된 날짜 (${state.selectedDates.length}개): ${state.selectedDates.join(', ')}`;
        display.className = 'selected-dates-display';
    }
}
