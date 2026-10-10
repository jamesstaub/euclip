// Comparator for Array#sort that orders objects by one property (ascending),
// replacing the removed `sortBy` array prototype extension:
//   items.slice().sort(byKey('order'))
export default function byKey<T extends Record<string, any>>(key: string) {
  return (a: T, b: T): number => {
    const x = a[key];
    const y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  };
}
