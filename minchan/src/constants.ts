export const MAX_USERS = 5;
export const REQUIRED_DUTY_PER_USER = 2;

// 알고리즘 기본 설정
export const DEFAULT_ALGORITHM_SETTINGS = {
	minDatesPerPerson: 1,
	minMeetingDates: 1,
	minMeetingsPerPerson: 0,
	minParticipantsPerMeeting: 2,
} as const;
