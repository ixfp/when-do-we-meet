import { useEffect, useMemo, useState } from "react";
import _ from "lodash";
import { User, UserId, selectionSchema } from "../types";
import { MAX_USERS } from "../constants";
import { loadSelections, saveSelections, clearSelections } from "../state/localStorage";

export function useUsers() {
	const [users, setUsers] = useState<User[]>(
		() => loadSelections(selectionSchema)?.users ?? [],
	);

	useEffect(() => {
		if (_.isEmpty(users)) {
			clearSelections();
		} else {
			saveSelections({ users });
		}
	}, [users]);

	const canAddUser = users.length < MAX_USERS;

	const [activeUserId, setActiveUserId] = useState<UserId | null>(null);
	const [isAddUserOpen, setIsAddUserOpen] = useState(false);
	const [proposedUserName, setProposedUserName] = useState<string>("");

	const activeUser = useMemo(
		() => _.find(users, (u) => u.id === activeUserId) ?? null,
		[users, activeUserId],
	);

	const openAddUserDialog = () => {
		if (!canAddUser) return;
		setProposedUserName(`사용자 ${users.length + 1}`);
		setIsAddUserOpen(true);
	};

	const confirmAddUser = (name: string) => {
		const trimmed = _.trim(name);
		if (_.isEmpty(trimmed)) return;
		const id = crypto.randomUUID();
		const newUser: User = { id, name: trimmed, selectedDates: [] };
		setUsers((prev) => [...prev, newUser]);
		setActiveUserId(id);
		setIsAddUserOpen(false);
	};

	const cancelAddUser = () => {
		setIsAddUserOpen(false);
	};

	const handleClearAll = () => {
		const confirmText = "모든 설정을 초기화할까요? 저장된 선택이 삭제됩니다.";
		if (!window.confirm(confirmText)) return;
		setUsers([]);
		setActiveUserId(null);
	};

	const handleRenameUser = (id: UserId, name: string) => {
		setUsers((prev) => _.map(prev, (u) => (u.id === id ? { ...u, name } : u)));
	};

	return {
		users,
		setUsers,
		canAddUser,
		activeUserId,
		setActiveUserId,
		activeUser,
		isAddUserOpen,
		proposedUserName,
		setProposedUserName,
		openAddUserDialog,
		confirmAddUser,
		cancelAddUser,
		handleClearAll,
		handleRenameUser,
	};
}

