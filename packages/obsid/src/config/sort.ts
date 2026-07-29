type SortablePropertyValue = Date | number;

type SortablePropertyKey<Properties extends object> = {
  [Key in keyof Properties]-?: [
    NonNullable<Properties[Key]>,
  ] extends [
    never,
  ]
    ? never
    : NonNullable<Properties[Key]> extends SortablePropertyValue
      ? Key
      : never;
}[keyof Properties] &
  string;

type NoteWithProperties = {
  readonly properties: object;
};

const getSortValue = (properties: object, key: string): SortablePropertyValue | undefined => {
  const value: unknown = Reflect.get(properties, key);

  if (value === undefined || typeof value === "number" || value instanceof Date) {
    return value;
  }

  throw new TypeError(`Property "${key}" must be a number or date to sort it`);
};

const compareSortValues = (
  left: SortablePropertyValue | undefined,
  right: SortablePropertyValue | undefined,
): number => {
  if (left === undefined) {
    return right === undefined ? 0 : 1;
  }

  if (right === undefined) {
    return -1;
  }

  const leftNumber = left instanceof Date ? left.getTime() : left;
  const rightNumber = right instanceof Date ? right.getTime() : right;

  return leftNumber - rightNumber;
};

const sortBy = <
  const Note extends NoteWithProperties,
  const Key extends SortablePropertyKey<Note["properties"]>,
>(
  notes: readonly Note[],
  key: Key,
): readonly Note[] =>
  notes.toSorted((left, right) =>
    compareSortValues(getSortValue(left.properties, key), getSortValue(right.properties, key)),
  );

export type { SortablePropertyKey, SortablePropertyValue };
export { sortBy };
