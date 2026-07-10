// OWNER: Member 2 - Motion Engine, IK, Safety, Shared Store
// Do not edit without coordinating with the owner.

export function interpolateValue(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}
