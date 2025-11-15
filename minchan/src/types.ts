import { z } from "zod";
import { MAX_USERS } from "./constants";

export type UserId = string;
export type IsoDate = string; // YYYY-MM-DD
export type Year = number;
export type MonthZeroBased = number; // 0 - 11

const userSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	selectedDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export type User = z.infer<typeof userSchema>;

export const selectionSchema = z.object({
	users: z.array(userSchema).max(MAX_USERS),
});

// 알고리즘 설정 타입
export type AlgorithmSettings = {
	minDatesPerPerson: number; // 인당 최소 선택 날짜 수
	minMeetingDates: number; // 최소 모임 횟수
	minMeetingsPerPerson: number; // 인당 최소 참석 모임 횟수 (0 = 제한 없음)
	minParticipantsPerMeeting: number; // 모임당 최소 참석 인원
};
