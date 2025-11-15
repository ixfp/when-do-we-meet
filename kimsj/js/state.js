// 애플리케이션 상태 관리
export const state = {
    votes: {},                          // 날짜별 투표 수
    participants: [],                   // 참가자 목록
    editingIndex: -1,                   // 수정 중인 참가자 인덱스 (-1이면 새로운 투표)
    currentDate: new Date(),            // 현재 표시 중인 달력의 날짜
    selectedDates: []                   // 선택된 날짜들
};

// 상태 업데이트 헬퍼 함수
export function resetSelectedDates() {
    state.selectedDates = [];
}

export function addSelectedDate(dateStr) {
    if (!state.selectedDates.includes(dateStr)) {
        state.selectedDates.push(dateStr);
        state.selectedDates.sort();
    }
}

export function removeSelectedDate(dateStr) {
    const index = state.selectedDates.indexOf(dateStr);
    if (index !== -1) {
        state.selectedDates.splice(index, 1);
    }
}

export function setEditingIndex(index) {
    state.editingIndex = index;
}

export function incrementVote(dateStr) {
    if (!state.votes.hasOwnProperty(dateStr)) {
        state.votes[dateStr] = 0;
    }
    state.votes[dateStr]++;
}

export function decrementVote(dateStr) {
    if (state.votes[dateStr]) {
        state.votes[dateStr]--;
    }
}

export function addParticipant(participant) {
    state.participants.push(participant);
}

export function updateParticipant(index, participant) {
    state.participants[index] = participant;
}

export function removeParticipant(index) {
    state.participants.splice(index, 1);
}

export function changeMonth(delta) {
    state.currentDate.setMonth(state.currentDate.getMonth() + delta);
}
