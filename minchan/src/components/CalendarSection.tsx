import { REQUIRED_DUTY_PER_USER } from "../constants";
import { MiniCalendar } from "./MiniCalendar";
import { useCalendar } from "../hooks/useCalendar";
import { useSelections } from "../hooks/useSelections";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface CalendarSectionProps {
	calendarHook: ReturnType<typeof useCalendar>;
	selectionsHook: ReturnType<typeof useSelections>;
}

export function CalendarSection({ calendarHook, selectionsHook }: CalendarSectionProps) {
	const {
		displayYear,
		displayMonth,
		handlePrevMonth,
		handleNextMonth,
		handleMonthInput,
	} = calendarHook;
	const { activeUser, toggleDateForActiveUser } = selectionsHook;

	return (
		<section className="mt-6">
			<h2 className="text-xl font-semibold mb-4">
				{activeUser ? `${activeUser.name}의 달력` : "사용자를 선택하세요"}
			</h2>
			<div className="flex gap-2 items-center mb-4">
				<Button variant="outline" size="icon" onClick={handlePrevMonth}>
					◀︎
				</Button>
				<Input
					type="month"
					value={`${displayYear}-${String(displayMonth + 1).padStart(2, "0")}`}
					onChange={(e) => handleMonthInput(e.target.value)}
					aria-label="월 선택"
					className="w-[180px]"
				/>
				<Button variant="outline" size="icon" onClick={handleNextMonth}>
					▶︎
				</Button>
			</div>
			<MiniCalendar
				year={displayYear}
				month={displayMonth}
				selectedDates={activeUser?.selectedDates ?? []}
				onToggleDate={toggleDateForActiveUser}
			/>
			<p className="text-muted-foreground mt-4 text-sm">
				주말은 하이라이트되며 선택/해제가 가능합니다. 각 사용자는 최소{" "}
				{REQUIRED_DUTY_PER_USER}일을 선택해야 합니다.
			</p>
		</section>
	);
}

