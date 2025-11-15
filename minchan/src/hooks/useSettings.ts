import { useState, useEffect } from "react";
import { AlgorithmSettings } from "../types";
import { DEFAULT_ALGORITHM_SETTINGS } from "../constants";

const SETTINGS_STORAGE_KEY = "meetingSettings";

export function useSettings() {
	const [settings, setSettings] = useState<AlgorithmSettings>(() => {
		if (typeof window === "undefined") {
			return DEFAULT_ALGORITHM_SETTINGS;
		}
		try {
			const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				return { ...DEFAULT_ALGORITHM_SETTINGS, ...parsed };
			}
		} catch (e) {
			console.error("Failed to load settings:", e);
		}
		return DEFAULT_ALGORITHM_SETTINGS;
	});

	useEffect(() => {
		try {
			localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
		} catch (e) {
			console.error("Failed to save settings:", e);
		}
	}, [settings]);

	const updateSettings = (newSettings: Partial<AlgorithmSettings>) => {
		setSettings((prev) => ({ ...prev, ...newSettings }));
	};

	const resetSettings = () => {
		setSettings(DEFAULT_ALGORITHM_SETTINGS);
	};

	return {
		settings,
		updateSettings,
		resetSettings,
	};
}

