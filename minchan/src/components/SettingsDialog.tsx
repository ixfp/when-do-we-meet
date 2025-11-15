import { useState, useEffect } from "react";
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
import { Label } from "./ui/label";
import { AlgorithmSettings } from "../types";
import { DEFAULT_ALGORITHM_SETTINGS } from "../constants";

interface SettingsDialogProps {
	open: boolean;
	onClose: () => void;
	settings: AlgorithmSettings;
	onSave: (settings: AlgorithmSettings) => void;
}

export function SettingsDialog({
	open,
	onClose,
	settings,
	onSave,
}: SettingsDialogProps) {
	const [formSettings, setFormSettings] = useState<AlgorithmSettings>(settings);

	useEffect(() => {
		setFormSettings(settings);
	}, [settings, open]);

	const handleSave = () => {
		// 유효성 검증
		if (formSettings.minDatesPerPerson < 1) {
			alert("인당 최소 선택 날짜 수는 1 이상이어야 합니다.");
			return;
		}
		if (formSettings.minMeetingDates < 1) {
			alert("최소 모임 횟수는 1 이상이어야 합니다.");
			return;
		}
		if (formSettings.minMeetingsPerPerson < 0) {
			alert("인당 최소 참석 모임 횟수는 0 이상이어야 합니다.");
			return;
		}
		if (formSettings.minParticipantsPerMeeting < 1) {
			alert("모임당 최소 참석 인원은 1 이상이어야 합니다.");
			return;
		}

		onSave(formSettings);
		onClose();
	};

	const handleReset = () => {
		setFormSettings(DEFAULT_ALGORITHM_SETTINGS);
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>알고리즘 설정</DialogTitle>
					<DialogDescription>
						모임 날짜 결정 알고리즘의 파라미터를 설정합니다.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="minDatesPerPerson">인당 최소 선택 날짜 수</Label>
						<Input
							id="minDatesPerPerson"
							type="number"
							min={1}
							value={formSettings.minDatesPerPerson}
							onChange={(e) =>
								setFormSettings((prev) => ({
									...prev,
									minDatesPerPerson: parseInt(e.target.value) || 1,
								}))
							}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="minMeetingDates">최소 모임 횟수</Label>
						<Input
							id="minMeetingDates"
							type="number"
							min={1}
							value={formSettings.minMeetingDates}
							onChange={(e) =>
								setFormSettings((prev) => ({
									...prev,
									minMeetingDates: parseInt(e.target.value) || 1,
								}))
							}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="minMeetingsPerPerson">
							인당 최소 참석 모임 횟수 (0 = 제한 없음)
						</Label>
						<Input
							id="minMeetingsPerPerson"
							type="number"
							min={0}
							value={formSettings.minMeetingsPerPerson}
							onChange={(e) =>
								setFormSettings((prev) => ({
									...prev,
									minMeetingsPerPerson: parseInt(e.target.value) || 0,
								}))
							}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="minParticipantsPerMeeting">
							모임당 최소 참석 인원
						</Label>
						<Input
							id="minParticipantsPerMeeting"
							type="number"
							min={1}
							value={formSettings.minParticipantsPerMeeting}
							onChange={(e) =>
								setFormSettings((prev) => ({
									...prev,
									minParticipantsPerMeeting: parseInt(e.target.value) || 2,
								}))
							}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={handleReset}>
						초기화
					</Button>
					<Button variant="outline" onClick={onClose}>
						취소
					</Button>
					<Button onClick={handleSave}>저장</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

