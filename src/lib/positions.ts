export const FORWARDS_POSITIONS = ["Prop", "Hooker", "Lock", "Flankers", "8"] as const;
export const BACKS_POSITIONS = ["Scrum Half", "Fly Half", "Center", "Winger", "Fullback"] as const;
export const ALL_POSITIONS = [...FORWARDS_POSITIONS, ...BACKS_POSITIONS];

// Only "Forwards" and "Backs" (exact name) get sub-divided by position;
// every other group (custom-named, or Unassigned) stays flat.
export function positionSubgroupsFor(groupName: string): readonly string[] | null {
  if (groupName === "Forwards") return FORWARDS_POSITIONS;
  if (groupName === "Backs") return BACKS_POSITIONS;
  return null;
}

export function subdivideByPosition<T extends { position: string | null }>(
  athletes: T[],
  positions: readonly string[]
): { label: string; athletes: T[] }[] {
  const sections: { label: string; athletes: T[] }[] = [];

  for (const pos of positions) {
    const matching = athletes.filter((a) => a.position === pos);
    if (matching.length > 0) sections.push({ label: pos, athletes: matching });
  }

  const noPosition = athletes.filter((a) => !positions.includes(a.position ?? ""));
  if (noPosition.length > 0) sections.push({ label: "No position", athletes: noPosition });

  return sections;
}
