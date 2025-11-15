// 알고리즘 설정 관리

// 기본 설정 값
export const defaultSettings = {
    minDatesPerPerson: 1,           // 인당 최소 선택 날짜 수
    minMeetingDates: 1,              // 최소 모임 횟수
    minMeetingsPerPerson: 0,         // 인당 최소 참석 모임 횟수 (0 = 제한 없음)
    minParticipantsPerMeeting: 2     // 모임당 최소 참석 인원
};

// 현재 설정 (초기값은 기본값)
export let settings = { ...defaultSettings };

// 설정 업데이트
export function updateSettings(newSettings) {
    settings = { ...settings, ...newSettings };
    saveSettingsToLocalStorage();
}

// 설정 초기화
export function resetSettings() {
    settings = { ...defaultSettings };
    saveSettingsToLocalStorage();
    updateSettingsUI();
}

// 로컬 스토리지에 설정 저장
function saveSettingsToLocalStorage() {
    try {
        localStorage.setItem('meetingSettings', JSON.stringify(settings));
    } catch (e) {
        console.error('Failed to save settings:', e);
    }
}

// 로컬 스토리지에서 설정 불러오기
export function loadSettingsFromLocalStorage() {
    try {
        const saved = localStorage.getItem('meetingSettings');
        if (saved) {
            settings = { ...defaultSettings, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error('Failed to load settings:', e);
    }
}

// 설정 UI 표시/숨김 토글
export function toggleSettingsPanel() {
    const panel = document.getElementById('settingsPanel');
    const isHidden = panel.style.display === 'none' || !panel.style.display;

    if (isHidden) {
        panel.style.display = 'block';
        updateSettingsUI();
    } else {
        panel.style.display = 'none';
    }
}

// 설정 UI 업데이트
export function updateSettingsUI() {
    document.getElementById('minDatesPerPerson').value = settings.minDatesPerPerson;
    document.getElementById('minMeetingDates').value = settings.minMeetingDates;
    document.getElementById('minMeetingsPerPerson').value = settings.minMeetingsPerPerson;
    document.getElementById('minParticipantsPerMeeting').value = settings.minParticipantsPerMeeting;
}

// 설정 저장 (UI에서 호출)
export function saveSettings() {
    const newSettings = {
        minDatesPerPerson: parseInt(document.getElementById('minDatesPerPerson').value) || 1,
        minMeetingDates: parseInt(document.getElementById('minMeetingDates').value) || 1,
        minMeetingsPerPerson: parseInt(document.getElementById('minMeetingsPerPerson').value) || 0,
        minParticipantsPerMeeting: parseInt(document.getElementById('minParticipantsPerMeeting').value) || 2
    };

    // 유효성 검증
    if (newSettings.minDatesPerPerson < 1) {
        alert('인당 최소 선택 날짜 수는 1 이상이어야 합니다.');
        return;
    }
    if (newSettings.minMeetingDates < 1) {
        alert('최소 모임 횟수는 1 이상이어야 합니다.');
        return;
    }
    if (newSettings.minMeetingsPerPerson < 0) {
        alert('인당 최소 참석 모임 횟수는 0 이상이어야 합니다.');
        return;
    }
    if (newSettings.minParticipantsPerMeeting < 1) {
        alert('모임당 최소 참석 인원은 1 이상이어야 합니다.');
        return;
    }

    updateSettings(newSettings);
    toggleSettingsPanel();
    alert('설정이 저장되었습니다.');

    // 결과 다시 계산 (window를 통해 접근)
    if (window.updateResults) {
        window.updateResults();
    }
}

// 설정 검증 함수들
export function validateMinDatesPerPerson(selectedDatesCount) {
    return selectedDatesCount >= settings.minDatesPerPerson;
}

export function getMinDatesPerPersonMessage() {
    return `최소 ${settings.minDatesPerPerson}개 이상의 날짜를 선택해주세요!`;
}
