import _ from "lodash";
import { format } from "date-fns";
import { User } from "../types";
import { useSchedule } from "../hooks/useSchedule";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface ScheduleResultProps {
	users: User[];
	scheduleHook: ReturnType<typeof useSchedule>;
}

export function ScheduleResult({ users, scheduleHook }: ScheduleResultProps) {
	const { validationMessage, schedule } = scheduleHook;

	if (validationMessage) {
		return (
			<section className="mt-6">
				<h2 className="text-xl font-semibold mb-4">결과</h2>
				<p className="text-destructive">{validationMessage}</p>
			</section>
		);
	}

	if (!schedule) return null;

	// 날짜별로 그룹화: 날짜 -> 사용자 목록
	const dateToUsers = new Map<string, User[]>();
	_.forEach(users, (user) => {
		const assignments = schedule.assignments.get(user.id) ?? [];
		_.forEach(assignments, (date) => {
			if (!dateToUsers.has(date)) {
				dateToUsers.set(date, []);
			}
			dateToUsers.get(date)!.push(user);
		});
	});

	// 날짜 정렬 (오름차순)
	const sortedDates = Array.from(dateToUsers.keys()).sort();

	return (
		<section className="mt-6">
			<h2 className="text-xl font-semibold mb-4">결과</h2>
			<div className="mb-4">
				<strong className="font-semibold">핵심일(선호도 높은 날짜 우선):</strong>{" "}
				{_.isEmpty(schedule.coreDates)
					? "없음"
					: _.map(schedule.coreDates, (d) => format(new Date(d), "yyyy-MM-dd")).join(", ")}
			</div>
			<Tabs defaultValue="by-user" className="w-full">
				<TabsList>
					<TabsTrigger value="by-user">사람별 보기</TabsTrigger>
					<TabsTrigger value="by-date">날짜별 보기</TabsTrigger>
				</TabsList>
				<TabsContent value="by-user" className="mt-4">
					<div>
						<strong className="font-semibold">배정 결과:</strong>
						<ul className="mt-2 space-y-1">
							{_.map(users, (u) => {
								const assignments = schedule.assignments.get(u.id) ?? [];
								return (
									<li key={u.id} className="text-sm">
										{u.name}:{" "}
										{_.isEmpty(assignments)
											? "없음"
											: _.map(assignments, (d) => format(new Date(d), "yyyy-MM-dd")).join(", ")}
									</li>
								);
							})}
						</ul>
					</div>
				</TabsContent>
				<TabsContent value="by-date" className="mt-4">
					<div>
						<strong className="font-semibold">날짜별 배정:</strong>
						{_.isEmpty(sortedDates) ? (
							<p className="mt-2 text-sm text-muted-foreground">배정된 날짜가 없습니다.</p>
						) : (
							<ul className="mt-2 space-y-2">
								{_.map(sortedDates, (date) => {
									const assignedUsers = dateToUsers.get(date) ?? [];
									const isCoreDate = _.includes(schedule.coreDates, date);
									return (
										<li key={date} className="text-sm border-l-2 pl-3 py-1">
											<div className="flex items-center gap-2">
												<span className="font-medium">
													{format(new Date(date), "yyyy-MM-dd")}
												</span>
												{isCoreDate && (
													<span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
														핵심일
													</span>
												)}
											</div>
											<div className="mt-1 text-muted-foreground">
												{_.isEmpty(assignedUsers)
													? "배정된 사용자 없음"
													: _.map(assignedUsers, (u) => u.name).join(", ")}
											</div>
										</li>
									);
								})}
							</ul>
						)}
					</div>
				</TabsContent>
			</Tabs>
		</section>
	);
}

