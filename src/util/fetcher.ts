export default async function fetcher<T>(url: string, timeout: number = 5000): Promise<T | void> {
  return await new Promise((resolve, _) => {
    fetch(url, {
      signal: AbortSignal.timeout(timeout)
    })
      .then(res => {
        if (res.headers.get("Content-Type") === "application/json")
          return res.json() as T;

        if (res.headers.get("Content-Type") === "text")
          return res.text() as T;

        return res.json() as T;
      })
      .then(resolve)
      .catch(() => resolve());
  });
}