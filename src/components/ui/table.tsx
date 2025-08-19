import React from "react";

type CommonProps = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function Table({ children, className = "", ...rest }: CommonProps) {
  return (
    <table
      className={`min-w-full w-full text-left divide-y divide-zinc-200 dark:divide-zinc-700 ${className}`}
      {...(rest as any)}
    >
      {children}
    </table>
  );
}

export function TableHeader({
  children,
  className = "",
  ...rest
}: CommonProps) {
  return (
    <thead
      className={`bg-zinc-50 dark:bg-zinc-800 ${className}`}
      {...(rest as any)}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "", ...rest }: CommonProps) {
  return (
    <tbody className={`${className}`} {...(rest as any)}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = "", ...rest }: CommonProps) {
  return (
    <tr
      className={`${className} hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors`}
      {...(rest as any)}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className = "",
  align = "left",
  width,
  ...rest
}: CommonProps & { align?: "left" | "center" | "right"; width?: string }) {
  const alignClass =
    align === "right"
      ? "text-right"
      : align === "center"
      ? "text-center"
      : "text-left";
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-xs font-medium text-zinc-600 dark:text-zinc-300 uppercase ${alignClass} ${className}`}
      style={width ? { width } : undefined}
      {...(rest as any)}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className = "",
  align = "left",
  truncate = false,
  width,
  ...rest
}: CommonProps & {
  align?: "left" | "center" | "right";
  truncate?: boolean;
  width?: string;
}) {
  const alignClass =
    align === "right"
      ? "text-right"
      : align === "center"
      ? "text-center"
      : "text-left";
  return (
    <td
      className={`px-4 py-3 align-top text-sm text-zinc-900 dark:text-white ${alignClass} ${
        truncate ? "truncate" : ""
      } ${className}`}
      style={width ? { width } : undefined}
      {...(rest as any)}
    >
      {children}
    </td>
  );
}

// default export optional
export default {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
};
