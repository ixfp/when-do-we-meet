import { useMemo } from "react";
import _ from "lodash";
import { User, AlgorithmSettings } from "../types";
import { computeSchedule, SchedulingResult } from "../scheduler/schedule";

export function useSchedule(users: User[], settings: AlgorithmSettings) {
	const validationMessage = (() => {
		if (_.isEmpty(users)) return "사용자를 추가하세요.";
		const underMin = _.find(
			users,
			(u) => u.selectedDates.length < settings.minDatesPerPerson,
		);
		if (underMin)
			return `${underMin.name} 님은 최소 ${settings.minDatesPerPerson}일을 선택해야 합니다.`;
		return null;
	})();

	const schedule: SchedulingResult | null = useMemo(() => {
		if (validationMessage) return null;
		return computeSchedule(
			new Map(_.map(users, (u) => [u.id, new Set(u.selectedDates)])),
			settings.minMeetingsPerPerson || settings.minDatesPerPerson,
			settings,
			users,
		);
	}, [users, validationMessage, settings]);

	return {
		validationMessage,
		schedule,
	};
}
