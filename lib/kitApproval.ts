export function kitActions(approved: boolean): { canCopy: boolean; showLink: boolean } {
  return { canCopy: approved, showLink: approved };
}
