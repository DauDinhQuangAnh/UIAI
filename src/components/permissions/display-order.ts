export interface DisplayOrderItem {
  id?: string;
  displayOrder?: number | null;
}

export function nextDisplayOrder<T extends DisplayOrderItem>(items: T[]): number {
  return Math.max(0, ...items.map((item) => item.displayOrder ?? 0)) + 1;
}

export function nextDisplayOrderWithinGroup<T extends DisplayOrderItem, TGroup>(
  items: T[],
  groupId: TGroup,
  getGroupId: (item: T) => TGroup,
): number {
  return nextDisplayOrder(items.filter((item) => getGroupId(item) === groupId));
}

export function validatePositiveIntegerDisplayOrder(value: number): boolean {
  return Number.isInteger(value) && value >= 1;
}

export function validateDuplicateDisplayOrder<T extends DisplayOrderItem>(
  items: T[],
  value: number,
  currentId?: string,
): boolean {
  return items.some((item) => item.id !== currentId && (item.displayOrder ?? 0) === value);
}

export function validateDuplicateDisplayOrderWithinGroup<T extends DisplayOrderItem, TGroup>(
  items: T[],
  groupId: TGroup,
  value: number,
  currentId: string | undefined,
  getGroupId: (item: T) => TGroup,
): boolean {
  return items.some(
    (item) =>
      item.id !== currentId &&
      getGroupId(item) === groupId &&
      (item.displayOrder ?? 0) === value,
  );
}

