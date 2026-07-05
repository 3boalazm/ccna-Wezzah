// state/useReviewQueue.ts
import { useEffect, useState } from "react";
import * as reviewEngine from "../engines/review-engine";

export function useReviewQueue(userId: string) {
  const [due, setDue] = useState<string[]>([]);

  useEffect(() => {
    setDue(reviewEngine.getDueReviews(userId));
  }, [userId]);

  return due;
}
