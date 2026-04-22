export type BarState =
  | "completed"
  | "active"
  | "pending"
  | "correct"
  | "wrong";

export function lessonBars(total: number, currentIndex: number): BarState[] {
  return Array.from({ length: total }, (_, i) =>
    i < currentIndex ? "completed" : i === currentIndex ? "active" : "pending",
  );
}
