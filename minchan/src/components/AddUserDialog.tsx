import _ from "lodash";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface AddUserDialogProps {
	open: boolean;
	initialName: string;
	onConfirm: (name: string) => void;
	onClose: () => void;
	onNameChange: (name: string) => void;
}

export function AddUserDialog({
	open,
	initialName,
	onConfirm,
	onClose,
	onNameChange,
}: AddUserDialogProps) {
	const canSubmit = !_.isEmpty(_.trim(initialName));

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>새 사용자 이름</DialogTitle>
					<DialogDescription>사용자의 이름을 입력하세요.</DialogDescription>
				</DialogHeader>
				<Input
					autoFocus
					placeholder="이름을 입력하세요"
					value={initialName}
					onChange={(e) => onNameChange(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && canSubmit) onConfirm(initialName);
						if (e.key === "Escape") onClose();
					}}
				/>
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						취소
					</Button>
					<Button onClick={() => onConfirm(initialName)} disabled={!canSubmit}>
						추가
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

