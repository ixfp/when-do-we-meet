import { IsoDate, UserId, AlgorithmSettings, User } from "../types";

export type SchedulingResult = {
	assignments: Map<UserId, IsoDate[]>;
	coreDates: IsoDate[];
	warnings: string[];
};

// type AvailabilityMap = Map<IsoDate, Set<UserId>>;

type Participant = {
	id: UserId;
	name: string;
	dates: IsoDate[];
};

/**
 * kimsj의 알고리즘을 기반으로 한 스케줄 계산
 */
export function computeSchedule(
	userToDates: Map<UserId, Set<IsoDate>>,
	requiredPerUser: number,
	settings: AlgorithmSettings,
	users: User[] = [],
): SchedulingResult {
	const warnings: string[] = [];

	// UserId를 Participant로 변환 (실제 이름 사용)
	const userIdToName = new Map<UserId, string>();
	users.forEach((user) => {
		userIdToName.set(user.id, user.name);
	});

	const participants: Participant[] = Array.from(userToDates.entries()).map(
		([id, dates]) => ({
			id,
			name: userIdToName.get(id) || id, // 실제 이름 또는 id 사용
			dates: Array.from(dates),
		}),
	);

	// 날짜별 투표 수 계산
	const votes: Record<IsoDate, number> = {};
	for (const [userId, dates] of userToDates) {
		for (const date of dates) {
			votes[date] = (votes[date] || 0) + 1;
		}
	}

	// 최종 모임 날짜 결정
	const result = determineFinalMeetingDates(votes, participants, settings);
	result.warnings.forEach((w) => warnings.push(w));

	// assignments 맵 생성
	const assignments = new Map<UserId, IsoDate[]>();
	for (const userId of userToDates.keys()) {
		assignments.set(userId, []);
	}

	// 날짜별 사용자 맵 생성
	const dateToUsers = new Map<IsoDate, Set<UserId>>();
	for (const [userId, dates] of userToDates) {
		for (const date of dates) {
			if (!dateToUsers.has(date)) {
				dateToUsers.set(date, new Set());
			}
			dateToUsers.get(date)!.add(userId);
		}
	}

	// 최종 날짜들을 각 참가자에게 배정
	for (const date of result.finalDates) {
		const users = dateToUsers.get(date);
		if (!users) continue;
		for (const userId of Array.from(users)) {
			const current = assignments.get(userId)!;
			if (!current.includes(date)) {
				current.push(date);
			}
		}
	}

	// 핵심일: 상위 25% 가량(최소 1개)을 핵심일로 정의
	const sortedDates = result.finalDates.sort();
	const coreCount = Math.max(1, Math.ceil(sortedDates.length * 0.25));
	const coreDates = sortedDates.slice(0, coreCount);

	return {
		assignments,
		coreDates,
		warnings,
	};
}

/**
 * 최종 모임 날짜 결정 알고리즘 (kimsj의 algorithm.js 기반)
 */
function determineFinalMeetingDates(
	votes: Record<IsoDate, number>,
	participants: Participant[],
	settings: AlgorithmSettings,
): { finalDates: IsoDate[]; warnings: string[] } {
	const warnings: string[] = [];

	// 1. 최소 참석 인원을 만족하는 날짜만 필터링
	const validDates = Object.entries(votes)
		.filter(([date, count]) => count >= settings.minParticipantsPerMeeting)
		.sort((a, b) => b[1] - a[1]); // 투표수 내림차순

	if (validDates.length === 0) {
		warnings.push(
			`최소 ${settings.minParticipantsPerMeeting}명 이상 참석 가능한 날짜가 없습니다.`,
		);
		return { finalDates: [], warnings };
	}

	// 2. 필요한 모임 횟수만큼 날짜 선택
	let selectedDates = validDates
		.slice(0, settings.minMeetingDates)
		.map(([date]) => date);

	if (selectedDates.length < settings.minMeetingDates) {
		warnings.push(
			`최소 ${settings.minMeetingDates}회의 모임 날짜가 필요하지만, ` +
				`${selectedDates.length}개의 날짜만 사용 가능합니다.`,
		);
	}

	// 3. 인당 최소 참석 모임 횟수 검증 (minMeetingsPerPerson > 0인 경우만)
	if (settings.minMeetingsPerPerson > 0) {
		const participantMeetingCounts = checkParticipantMeetingCounts(
			selectedDates,
			participants,
		);

		// 조건을 만족하지 못하는 참가자 확인
		const insufficientParticipants = participantMeetingCounts.filter(
			(p) => p.count < settings.minMeetingsPerPerson,
		);

		if (insufficientParticipants.length > 0) {
			// 더 많은 날짜를 추가하여 조건 만족 시도
			selectedDates = tryAddMoreDates(
				selectedDates,
				validDates,
				participants,
				settings,
			);

			// 재검증
			const recheck = checkParticipantMeetingCounts(selectedDates, participants);
			const stillInsufficient = recheck.filter(
				(p) => p.count < settings.minMeetingsPerPerson,
			);

			if (stillInsufficient.length > 0) {
				warnings.push(
					`다음 참가자들이 최소 ${settings.minMeetingsPerPerson}회 참석 조건을 만족하지 못합니다: ` +
						stillInsufficient.map((p) => `${p.name}(${p.count}회)`).join(", "),
				);
			}
		}
	}

	return {
		finalDates: selectedDates,
		warnings,
	};
}

/**
 * 각 참가자가 참석 가능한 모임 횟수 계산
 */
function checkParticipantMeetingCounts(
	selectedDates: IsoDate[],
	participants: Participant[],
): Array<{ name: string; count: number }> {
	return participants.map((participant) => {
		const count = selectedDates.filter((date) =>
			participant.dates.includes(date),
		).length;
		return {
			name: participant.name,
			count: count,
		};
	});
}

/**
 * 조건을 만족하도록 더 많은 날짜 추가 시도
 */
function tryAddMoreDates(
	currentDates: IsoDate[],
	allValidDates: Array<[IsoDate, number]>,
	participants: Participant[],
	settings: AlgorithmSettings,
): IsoDate[] {
	const maxAttempts = Math.min(allValidDates.length, 20); // 최대 20개까지
	let bestDates = [...currentDates];

	for (let i = currentDates.length; i < maxAttempts; i++) {
		const candidate = allValidDates[i];
		if (!candidate) break;

		const testDates = [...currentDates, candidate[0]];
		const counts = checkParticipantMeetingCounts(testDates, participants);

		// 모든 참가자가 조건을 만족하는지 확인
		const allSatisfied = counts.every(
			(p) => p.count >= settings.minMeetingsPerPerson,
		);

		if (allSatisfied) {
			return testDates;
		}

		// 조건을 만족하지 못하더라도 개선되면 저장
		const currentUnsatisfied = checkParticipantMeetingCounts(
			bestDates,
			participants,
		).filter((p) => p.count < settings.minMeetingsPerPerson).length;
		const newUnsatisfied = counts.filter(
			(p) => p.count < settings.minMeetingsPerPerson,
		).length;

		if (newUnsatisfied < currentUnsatisfied) {
			bestDates = testDates;
		}
	}

	return bestDates;
}
