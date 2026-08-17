import { createContext, useContext } from "react";

export const FeedbackContext = createContext<{ open: () => void }>({
  open: () => {},
});

export function useFeedback() {
  return useContext(FeedbackContext);
}
