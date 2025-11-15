import { IsoDate, UserId } from "../App";

export type SchedulingResult = {
	assignments: Map<UserId, IsoDate[]>;
	coreDates: IsoDate[];
};

type AvailabilityMap = Map<IsoDate, Set<UserId>>;

export function computeSchedule(
	userToDates: Map<UserId, Set<IsoDate>>,
	requiredPerUser: number,
): SchedulingResult {
	const assignments = new Map<UserId, IsoDate[]>();
	for (const userId of userToDates.keys()) {
		assignments.set(userId, []);
	}

	const availability: AvailabilityMap = buildAvailability(userToDates);
	const orderedDates = Array.from(availability.entries())
		.sort((a, b) => {
			const diff = b[1].size - a[1].size;
			if (diff !== 0) return diff;
			return a[0].localeCompare(b[0]);
		})
		.map(([d]) => d);

	// 1) 높은 선호도 날짜(핵심일)부터 최대 배정
	for (const date of orderedDates) {
		const users = availability.get(date);
		if (!users) continue;
		for (const userId of Array.from(users)) {
			const current = assignments.get(userId)!;
			if (current.length >= requiredPerUser) continue;
			// 같은 날짜 중복 배정 방지
			if (!current.includes(date)) {
				current.push(date);
			}
		}
	}

	// 2) 아직 부족한 사람들에게 대체(추가근무) 날짜를 최소화하도록 다시 고빈도 날짜 위주로 배정 시도
	//    남은 필요 수를 가진 사용자들을 모으고, 그들이 공통으로 가능한 날짜를 우선 선택
	let needMore = getUsersNeedMore(assignments, requiredPerUser);
	if (needMore.size > 0) {
		// 재정렬: 아직 배정 안 된 사용자들에게도 인기가 높은 날짜 우선
		const reOrderedDates = Array.from(availability.entries())
			.map(([d, set]) => {
				const overlap = Array.from(set).filter((u) => needMore.has(u)).length;
				return { d, overlap, total: set.size };
			})
			.sort((a, b) => (b.overlap - a.overlap) || (b.total - a.total) || a.d.localeCompare(b.d))
			.map((x) => x.d);

		for (const date of reOrderedDates) {
			for (const userId of Array.from(needMore)) {
				const can = userToDates.get(userId)?.has(date);
				if (!can) continue;
				const current = assignments.get(userId)!;
				if (!current.includes(date)) current.push(date);
				if (current.length >= requiredPerUser) needMore.delete(userId);
			}
			if (needMore.size === 0) break;
		}
	}

	// 핵심일: 상위 25% 가량(최소 1개)을 핵심일로 정의
	const coreCount = Math.max(1, Math.ceil(orderedDates.length * 0.25));
	const coreDates = orderedDates.slice(0, coreCount);

	return { assignments, coreDates };
}

function buildAvailability(userToDates: Map<UserId, Set<IsoDate>>): AvailabilityMap {
	const map: AvailabilityMap = new Map();
	for (const [userId, dates] of userToDates) {
		for (const d of dates) {
			if (!map.has(d)) map.set(d, new Set());
			map.get(d)!.add(userId);
		}
	}
	return map;
}

function getUsersNeedMore(
	assignments: Map<UserId, IsoDate[]>,
	requiredPerUser: number,
): Set<UserId> {
	const set = new Set<UserId>();
	for (const [userId, dates] of assignments) {
		if (dates.length < requiredPerUser) set.add(userId);
	}
	return set;
}

