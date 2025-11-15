import { state, resetSelectedDates, setEditingIndex, incrementVote, decrementVote, addParticipant, updateParticipant, removeParticipant } from './state.js';
import { generateCalendar, updateSelectedDatesDisplay } from './calendar.js';
import { updateResults, updateParticipantsList } from './display.js';
import { settings } from './settings.js';

// 투표 추가 또는 수정
export function addVote() {
    const nameInput = document.getElementById('nameInput');
    const name = nameInput.value.trim();

    if (!name) {
        alert('이름을 입력해주세요!');
        return;
    }

    if (state.selectedDates.length === 0) {
        alert('최소 한 개 이상의 날짜를 선택해주세요!');
        return;
    }

    // 인당 최소 선택 날짜 수 검증
    if (state.selectedDates.length < settings.minDatesPerPerson) {
        alert(`최소 ${settings.minDatesPerPerson}개 이상의 날짜를 선택해주세요! (현재: ${state.selectedDates.length}개)`);
        return;
    }

    const isEditing = state.editingIndex !== -1;

    // 수정 모드인 경우 기존 투표 제거
    if (isEditing) {
        const oldParticipant = state.participants[state.editingIndex];
        oldParticipant.dates.forEach(date => {
            decrementVote(date);
        });

        // 참가자 정보 업데이트
        updateParticipant(state.editingIndex, {
            name: name,
            dates: [...state.selectedDates]
        });

        setEditingIndex(-1);
        document.querySelector('.vote-section button').textContent = '투표하기';
    } else {
        // 새로운 투표 추가
        addParticipant({
            name: name,
            dates: [...state.selectedDates]
        });
    }

    // 새로운 투표 수 증가
    state.selectedDates.forEach(date => {
        incrementVote(date);
    });

    // 입력 초기화
    nameInput.value = '';
    resetSelectedDates();
    updateSelectedDatesDisplay();
    generateCalendar(); // 달력 다시 그려서 선택 표시 제거

    // 결과 업데이트
    updateResults();
    updateParticipantsList();

    alert(isEditing ? '투표가 수정되었습니다!' : '투표가 완료되었습니다!');
}

// 투표 삭제
export function deleteVote(index) {
    if (!confirm('정말로 이 투표를 삭제하시겠습니까?')) {
        return;
    }

    const participant = state.participants[index];

    // 투표 수 감소
    participant.dates.forEach(date => {
        decrementVote(date);
    });

    // 참가자 목록에서 제거
    removeParticipant(index);

    // 결과 업데이트
    updateResults();
    updateParticipantsList();

    // 수정 모드였다면 취소
    if (state.editingIndex === index) {
        cancelEdit();
    } else if (state.editingIndex > index) {
        setEditingIndex(state.editingIndex - 1);
    }

    alert('투표가 삭제되었습니다!');
}

// 투표 수정
export function editVote(index) {
    const participant = state.participants[index];

    // 이름 입력
    document.getElementById('nameInput').value = participant.name;

    // 선택된 날짜 설정
    state.selectedDates = [...participant.dates];
    updateSelectedDatesDisplay();

    // 달력 다시 그리기 (선택 표시를 위해)
    generateCalendar();

    // 수정 모드 설정
    setEditingIndex(index);
    document.querySelector('.vote-section button').textContent = '수정 완료';

    // 스크롤을 투표 섹션으로 이동
    document.querySelector('.vote-section').scrollIntoView({ behavior: 'smooth' });
}

// 수정 취소
export function cancelEdit() {
    setEditingIndex(-1);
    document.getElementById('nameInput').value = '';
    resetSelectedDates();
    updateSelectedDatesDisplay();
    generateCalendar();
    document.querySelector('.vote-section button').textContent = '투표하기';
}
