import { handleSetupCoachmarkEvent } from "@/app/[locale]/(protected)/setup/_lib/setup-coachmark";
import { EventData } from "react-joyride";

export const useSetupCoachmarkEventHook = (
  mode: string,
  setIsRunning: (value: boolean) => void,
) => {
  const handleEvent = (data: EventData) => {
    handleSetupCoachmarkEvent(data, setIsRunning, {
      persistDismissed: mode === "default",
    });
  };

  return { handleEvent };
};
