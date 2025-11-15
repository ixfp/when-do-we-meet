import { state } from './state.js';
import { determineFinalMeetingDates, calculateStatistics } from './algorithm.js';

// 결과 업데이트
export function updateResults() {
    const resultsSection = document.getElementById('resultsSection');

    // 투표 수로 정렬
    const sortedDates = Object.entries(state.votes)
        .filter(([date, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);

    if (sortedDates.length === 0) {
        resultsSection.innerHTML = '';
        return;
    }

    let html = '';

    // 알고리즘을 사용하여 최종 모임 날짜 결정
    const { finalDates, warnings } = determineFinalMeetingDates(state.votes, state.participants);

    // 경고 메시지 표시
    if (warnings.length > 0) {
        html += '<div class="algorithm-warnings">';
        html += '<h4>⚠️ 알고리즘 경고</h4>';
        html += '<ul>';
        warnings.forEach(warning => {
            html += `<li>${warning}</li>`;
        });
        html += '</ul>';
        html += '</div>';
    }

    // 최종 모임 날짜 표시
    if (finalDates.length > 0) {
        const stats = calculateStatistics(finalDates, state.participants, state.votes);

        if (finalDates.length === 1) {
            html += `
                <div class="winner">
                    🎉 최종 모임 날짜: ${finalDates[0]} (${state.votes[finalDates[0]]}명 참석)
                </div>
            `;
        } else {
            html += `
                <div class="winner">
                    🎉 최종 모임 날짜 (${finalDates.length}회)
                </div>
            `;
        }

        // 참가자별 통계
        html += '<div class="participant-stats">';
        html += '<h3>참가자별 참석 현황</h3>';
        stats.participantStats.forEach(stat => {
            const percentage = ((stat.attendingCount / finalDates.length) * 100).toFixed(0);
            html += `
                <div class="stat-item">
                    <div class="stat-header">
                        <span class="stat-name">${stat.name}</span>
                        <span class="stat-info">${stat.attendingCount}/${finalDates.length}회 참석 (${percentage}%)</span>
                    </div>
                    <div class="stat-dates">
                        <strong>참석 날짜:</strong> ${stat.attendingDates.length > 0 ? stat.attendingDates.join(', ') : '없음'}
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }

    // 모든 투표 결과 표시
    html += '<h2>전체 투표 결과</h2>';
    const maxVotes = sortedDates[0][1];
    const maxBarWidth = 300;

    sortedDates.forEach(([date, count]) => {
        const barWidth = (count / maxVotes) * maxBarWidth;
        const isFinal = finalDates.includes(date);
        const itemClass = isFinal ? 'result-item final-date' : 'result-item';

        html += `
            <div class="${itemClass}">
                <span class="result-date">${date} ${isFinal ? '✓' : ''}</span>
                <div class="result-votes">
                    <div class="vote-bar" style="width: ${barWidth}px;"></div>
                    <span class="vote-count">${count}표</span>
                </div>
            </div>
        `;
    });

    resultsSection.innerHTML = html;
}

// 참가자 목록 업데이트
export function updateParticipantsList() {
    const participantsList = document.getElementById('participantsList');

    if (state.participants.length === 0) {
        participantsList.innerHTML = '';
        return;
    }

    let html = '<h3>참가자 목록 (' + state.participants.length + '명)</h3>';

    state.participants.forEach((participant, index) => {
        html += `
            <div class="participant-item">
                <div class="participant-info">
                    <div class="participant-name">${participant.name}</div>
                    <div class="participant-dates">가능한 날짜: ${participant.dates.join(', ')}</div>
                </div>
                <div class="participant-actions">
                    <button class="btn-edit" onclick="window.editVote(${index})">수정</button>
                    <button class="btn-delete" onclick="window.deleteVote(${index})">삭제</button>
                </div>
            </div>
        `;
    });

    participantsList.innerHTML = html;
}
