import { STATUS, type EventData } from "react-joyride";

export const useProfileCoachmarkEvent = (
  setIsRunning: (value: boolean) => void,
) => {
  const handleEvent = (data: EventData) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      setIsRunning(false);
    }
  };

  return { handleEvent };
};
