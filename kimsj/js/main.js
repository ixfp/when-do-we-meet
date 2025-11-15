// 모든 모듈 import
import { generateCalendar, changeMonth } from './calendar.js';
import { addVote, deleteVote, editVote } from './vote.js';
import { toggleSettingsPanel, saveSettings, resetSettings, loadSettingsFromLocalStorage } from './settings.js';
import { updateResults } from './display.js';

// HTML에서 onclick으로 호출할 수 있도록 전역 함수로 노출
window.changeMonth = changeMonth;
window.addVote = addVote;
window.deleteVote = deleteVote;
window.editVote = editVote;
window.toggleSettingsPanel = toggleSettingsPanel;
window.saveSettings = saveSettings;
window.resetSettings = resetSettings;
window.updateResults = updateResults;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 저장된 설정 불러오기
    loadSettingsFromLocalStorage();

    // 달력 생성
    generateCalendar();
});
