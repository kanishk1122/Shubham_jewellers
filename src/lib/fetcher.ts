export async function apiFetch(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers((init?.headers as HeadersInit) || {});

  if (
    !headers.has("Content-Type") &&
    !(init && init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(input, {
    ...init,
    headers,
    // include cookies for cross-origin scenarios too; server cookie is HttpOnly and will be sent
    credentials: "include",
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
