"use client";
import { useMemo, useState } from "react";

export type Dir = "asc" | "desc";
type Val = string | number | null | undefined;

/** Stable sort of `rows` by a column key; nulls last. Pure (for grouped tables). */
export function sortBy<T>(rows: T[], getVal: (r: T, key: string) => Val, key: string | null, dir: Dir): T[] {
  if (!key) return rows;
  const a = rows.map((r, i) => [r, i] as const);
  a.sort(([x, xi], [y, yi]) => {
    const xv = getVal(x, key), yv = getVal(y, key);
    if (xv == null && yv == null) return xi - yi;
    if (xv == null) return 1;
    if (yv == null) return -1;
    let c: number;
    if (typeof xv === "number" && typeof yv === "number") c = xv - yv;
    else c = String(xv).localeCompare(String(yv), undefined, { numeric: true });
    return c === 0 ? xi - yi : dir === "asc" ? c : -c;
  });
  return a.map(([r]) => r);
}

/** Click-to-sort for a flat row array. `getVal(row, key)` returns the sort value for
 *  a column key; nulls always sort last. Returns the sorted rows + header helpers. */
export function useSort<T>(
  rows: T[],
  getVal: (r: T, key: string) => Val,
  init?: { key: string; dir?: Dir },
) {
  const [key, setKey] = useState<string | null>(init?.key ?? null);
  const [dir, setDir] = useState<Dir>(init?.dir ?? "desc");

  const sorted = useMemo(() => {
    if (!key) return rows;
    const a = rows.map((r, i) => [r, i] as const);
    a.sort(([x, xi], [y, yi]) => {
      const xv = getVal(x, key), yv = getVal(y, key);
      if (xv == null && yv == null) return xi - yi;
      if (xv == null) return 1;
      if (yv == null) return -1;
      let c: number;
      if (typeof xv === "number" && typeof yv === "number") c = xv - yv;
      else c = String(xv).localeCompare(String(yv), undefined, { numeric: true });
      if (c === 0) return xi - yi; // stable
      return dir === "asc" ? c : -c;
    });
    return a.map(([r]) => r);
  }, [rows, key, dir, getVal]);

  const onSort = (k: string) =>
    key === k ? setDir((d) => (d === "asc" ? "desc" : "asc")) : (setKey(k), setDir("desc"));

  return { sorted, sortKey: key, dir, onSort };
}

/** Clickable, sort-aware table header cell. */
export function Th({
  k, sortKey, dir, onSort, children, style, title,
}: {
  k: string;
  sortKey: string | null;
  dir: Dir;
  onSort: (k: string) => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
  title?: string;
}) {
  const active = sortKey === k;
  return (
    <th
      onClick={() => onSort(k)}
      title={title ?? "Sort"}
      style={{ cursor: "pointer", whiteSpace: "nowrap", userSelect: "none", ...style }}
    >
      {children}
      <span style={{ marginLeft: 3, fontSize: ".72em", color: active ? "var(--accent)" : "var(--muted)", opacity: active ? 1 : 0.4 }}>
        {active ? (dir === "asc" ? "▲" : "▼") : "▼"}
      </span>
    </th>
  );
}
