import { AddUserDialog } from "./components/AddUserDialog";
import { UserManagement } from "./components/UserManagement";
import { CalendarSection } from "./components/CalendarSection";
import { ScheduleResult } from "./components/ScheduleResult";
import { useUsers } from "./hooks/useUsers";
import { useCalendar } from "./hooks/useCalendar";
import { useSelections } from "./hooks/useSelections";
import { useSchedule } from "./hooks/useSchedule";

export default function App() {
	const usersHook = useUsers();
	const calendarHook = useCalendar();

	const {
		users,
		setUsers,
		activeUserId,
		isAddUserOpen,
		proposedUserName,
		setProposedUserName,
		confirmAddUser,
		cancelAddUser,
		handleClearAll: clearUsers,
	} = usersHook;

	const selectionsHook = useSelections({
		users,
		setUsers,
		activeUserId,
	});

	const scheduleHook = useSchedule(users);

	
	const handleClearAll = () => {
		const { resetToToday } = calendarHook;
		clearUsers();
		resetToToday();
	};

	return (
		<div className="container mx-auto p-4 max-w-4xl">
			<h1 className="text-3xl font-bold mb-6">근무 스케줄러</h1>

			<UserManagement
				usersHook={usersHook}
				selectionsHook={selectionsHook}
				onClearAll={handleClearAll}
			/>

			<CalendarSection calendarHook={calendarHook} selectionsHook={selectionsHook} />

			<AddUserDialog
				open={isAddUserOpen}
				initialName={proposedUserName}
				onConfirm={confirmAddUser}
				onClose={cancelAddUser}
				onNameChange={setProposedUserName}
			/>

			<ScheduleResult users={users} scheduleHook={scheduleHook} />
		</div>
	);
}

