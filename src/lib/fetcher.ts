// lib/fetcher.ts

export const getToken = () => {
  if (typeof window === "undefined") return undefined;
  const t = localStorage.getItem("token");
  if (t) return t;
  const m = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : undefined;
};

export async function apiFetch(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers((init?.headers as HeadersInit) || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  // don't override content-type for FormData bodies
  if (
    !headers.has("Content-Type") &&
    !(init && init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(input, {
    ...init,
    headers,
    credentials: "same-origin",
  });
  return res;
}

// convenience: call and return parsed JSON or throw with details on non-OK
export async function apiJson(input: RequestInfo, init?: RequestInit) {
  const res = await apiFetch(input, init);
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse errors
  }
  if (!res.ok) {
    const err: any = new Error(
      data?.error || res.statusText || "Request failed"
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
