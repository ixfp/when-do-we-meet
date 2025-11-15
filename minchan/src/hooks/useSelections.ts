import _ from "lodash";
import { User, IsoDate } from "../types";

interface UseSelectionsProps {
	users: User[];
	setUsers: React.Dispatch<React.SetStateAction<User[]>>;
	activeUserId: string | null;
}

export function useSelections({ users, setUsers, activeUserId }: UseSelectionsProps) {
	const activeUser = _.find(users, (u) => u.id === activeUserId) ?? null;

	const toggleDateForActiveUser = (iso: IsoDate) => {
		if (!activeUser) return;
		setUsers((prev) =>
			_.map(prev, (u) =>
				u.id === activeUser.id
					? {
							...u,
							selectedDates: _.includes(u.selectedDates, iso)
								? _.without(u.selectedDates, iso)
								: [...u.selectedDates, iso],
					  }
					: u,
			),
		);
	};

	return {
		activeUser,
		toggleDateForActiveUser,
	};
}

