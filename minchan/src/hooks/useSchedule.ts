import { useMemo } from "react";
import _ from "lodash";
import { User } from "../types";
import { REQUIRED_DUTY_PER_USER } from "../constants";
import { computeSchedule, SchedulingResult } from "../scheduler/schedule";

export function useSchedule(users: User[]) {
	const validationMessage = (() => {
		if (_.isEmpty(users)) return "사용자를 추가하세요.";
		const underMin = _.find(
			users,
			(u) => u.selectedDates.length < REQUIRED_DUTY_PER_USER,
		);
		if (underMin)
			return `${underMin.name} 님은 최소 ${REQUIRED_DUTY_PER_USER}일을 선택해야 합니다.`;
		return null;
	})();

	const schedule: SchedulingResult | null = useMemo(() => {
		if (validationMessage) return null;
		return computeSchedule(
			new Map(_.map(users, (u) => [u.id, new Set(u.selectedDates)])),
			REQUIRED_DUTY_PER_USER,
		);
	}, [users, validationMessage]);

	return {
		validationMessage,
		schedule,
	};
}

