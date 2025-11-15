import { useState } from "react";
import { AddUserDialog } from "./components/AddUserDialog";
import { UserManagement } from "./components/UserManagement";
import { CalendarSection } from "./components/CalendarSection";
import { ScheduleResult } from "./components/ScheduleResult";
import { SettingsDialog } from "./components/SettingsDialog";
import { useUsers } from "./hooks/useUsers";
import { useCalendar } from "./hooks/useCalendar";
import { useSelections } from "./hooks/useSelections";
import { useSchedule } from "./hooks/useSchedule";
import { useSettings } from "./hooks/useSettings";
import { Button } from "./components/ui/button";

export default function App() {
	const usersHook = useUsers();
	const calendarHook = useCalendar();
	const settingsHook = useSettings();
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

	const scheduleHook = useSchedule(users, settingsHook.settings);

	const handleClearAll = () => {
		const { resetToToday } = calendarHook;
		clearUsers();
		resetToToday();
	};

	return (
		<div className="container mx-auto p-4 max-w-4xl">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">근무 스케줄러</h1>
				<Button
					variant="outline"
					onClick={() => setIsSettingsOpen(true)}
				>
					알고리즘 설정
				</Button>
			</div>

			<UserManagement
				usersHook={usersHook}
				selectionsHook={selectionsHook}
				onClearAll={handleClearAll}
			/>

			<CalendarSection
				calendarHook={calendarHook}
				selectionsHook={selectionsHook}
				users={users}
				schedule={scheduleHook.schedule}
				settings={settingsHook.settings}
			/>

			<AddUserDialog
				open={isAddUserOpen}
				initialName={proposedUserName}
				onConfirm={confirmAddUser}
				onClose={cancelAddUser}
				onNameChange={setProposedUserName}
			/>

			<SettingsDialog
				open={isSettingsOpen}
				onClose={() => setIsSettingsOpen(false)}
				settings={settingsHook.settings}
				onSave={settingsHook.updateSettings}
			/>

			<ScheduleResult
				users={users}
				scheduleHook={scheduleHook}
			/>
		</div>
	);
}
