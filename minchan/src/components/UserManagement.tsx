import { MAX_USERS } from "../constants";
import { useUsers } from "../hooks/useUsers";
import { useSelections } from "../hooks/useSelections";
import { Button } from "./ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";

interface UserManagementProps {
	usersHook: ReturnType<typeof useUsers>;
	selectionsHook: ReturnType<typeof useSelections>;
	onClearAll: () => void;
}

export function UserManagement({
	usersHook,
	selectionsHook,
	onClearAll,
}: UserManagementProps) {
	const {
		users,
		canAddUser,
		activeUserId,
		setActiveUserId,
		openAddUserDialog,
		handleRenameUser,
	} = usersHook;
	const { activeUser } = selectionsHook;

	return (
		<section className="flex gap-4 items-center flex-wrap">
			<Button onClick={openAddUserDialog} disabled={!canAddUser}>
				사용자 추가 ({users.length}/{MAX_USERS})
			</Button>
			<Button variant="outline" onClick={onClearAll} disabled={users.length === 0}>
				전체 초기화
			</Button>
			{users.length > 0 && (
				<Select
					value={activeUserId ?? undefined}
					onValueChange={(value) => setActiveUserId(value || null)}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="활성 사용자 선택" />
					</SelectTrigger>
					<SelectContent>
						{users.map((u) => (
							<SelectItem key={u.id} value={u.id}>
								{u.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
			{activeUser && (
				<Input
					placeholder="이름 변경"
					value={activeUser.name}
					onChange={(e) => handleRenameUser(activeUser.id, e.target.value)}
					className="w-[200px]"
				/>
			)}
		</section>
	);
}

