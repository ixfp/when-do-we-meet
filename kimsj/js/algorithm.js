import { settings } from './settings.js';

/**
 * 최종 모임 날짜 결정 알고리즘
 * @param {Object} votes - 날짜별 투표 수 { '날짜': 투표수, ... }
 * @param {Array} participants - 참가자 목록 [{ name, dates }, ...]
 * @returns {Object} { finalDates: [], warnings: [] }
 */
export function determineFinalMeetingDates(votes, participants) {
    const warnings = [];

    // 1. 최소 참석 인원을 만족하는 날짜만 필터링
    const validDates = Object.entries(votes)
        .filter(([date, count]) => count >= settings.minParticipantsPerMeeting)
        .sort((a, b) => b[1] - a[1]); // 투표수 내림차순

    if (validDates.length === 0) {
        warnings.push(`최소 ${settings.minParticipantsPerMeeting}명 이상 참석 가능한 날짜가 없습니다.`);
        return { finalDates: [], warnings };
    }

    // 2. 필요한 모임 횟수만큼 날짜 선택
    let selectedDates = validDates.slice(0, settings.minMeetingDates).map(([date]) => date);

    if (selectedDates.length < settings.minMeetingDates) {
        warnings.push(
            `최소 ${settings.minMeetingDates}회의 모임 날짜가 필요하지만, ` +
            `${selectedDates.length}개의 날짜만 사용 가능합니다.`
        );
    }

    // 3. 인당 최소 참석 모임 횟수 검증 (minMeetingsPerPerson > 0인 경우만)
    if (settings.minMeetingsPerPerson > 0) {
        const participantMeetingCounts = checkParticipantMeetingCounts(selectedDates, participants);

        // 조건을 만족하지 못하는 참가자 확인
        const insufficientParticipants = participantMeetingCounts.filter(
            p => p.count < settings.minMeetingsPerPerson
        );

        if (insufficientParticipants.length > 0) {
            // 더 많은 날짜를 추가하여 조건 만족 시도
            selectedDates = tryAddMoreDates(selectedDates, validDates, participants);

            // 재검증
            const recheck = checkParticipantMeetingCounts(selectedDates, participants);
            const stillInsufficient = recheck.filter(
                p => p.count < settings.minMeetingsPerPerson
            );

            if (stillInsufficient.length > 0) {
                warnings.push(
                    `다음 참가자들이 최소 ${settings.minMeetingsPerPerson}회 참석 조건을 만족하지 못합니다: ` +
                    stillInsufficient.map(p => `${p.name}(${p.count}회)`).join(', ')
                );
            }
        }
    }

    return {
        finalDates: selectedDates,
        warnings
    };
}

/**
 * 각 참가자가 참석 가능한 모임 횟수 계산
 */
function checkParticipantMeetingCounts(selectedDates, participants) {
    return participants.map(participant => {
        const count = selectedDates.filter(date => participant.dates.includes(date)).length;
        return {
            name: participant.name,
            count: count
        };
    });
}

/**
 * 조건을 만족하도록 더 많은 날짜 추가 시도
 */
function tryAddMoreDates(currentDates, allValidDates, participants) {
    const maxAttempts = Math.min(allValidDates.length, 20); // 최대 20개까지
    let bestDates = [...currentDates];

    for (let i = currentDates.length; i < maxAttempts; i++) {
        const candidate = allValidDates[i];
        if (!candidate) break;

        const testDates = [...currentDates, candidate[0]];
        const counts = checkParticipantMeetingCounts(testDates, participants);

        // 모든 참가자가 조건을 만족하는지 확인
        const allSatisfied = counts.every(p => p.count >= settings.minMeetingsPerPerson);

        if (allSatisfied) {
            return testDates;
        }

        // 조건을 만족하지 못하더라도 개선되면 저장
        const currentUnsatisfied = checkParticipantMeetingCounts(bestDates, participants)
            .filter(p => p.count < settings.minMeetingsPerPerson).length;
        const newUnsatisfied = counts.filter(p => p.count < settings.minMeetingsPerPerson).length;

        if (newUnsatisfied < currentUnsatisfied) {
            bestDates = testDates;
        }
    }

    return bestDates;
}

/**
 * 결과 통계 계산
 */
export function calculateStatistics(finalDates, participants, votes) {
    return {
        totalMeetings: finalDates.length,
        participantStats: participants.map(participant => {
            const attendingDates = finalDates.filter(date => participant.dates.includes(date));
            return {
                name: participant.name,
                attendingCount: attendingDates.length,
                attendingDates: attendingDates
            };
        }),
        dateStats: finalDates.map(date => ({
            date: date,
            participants: votes[date] || 0
        }))
    };
}
