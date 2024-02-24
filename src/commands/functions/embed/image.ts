export default async function image(url: string): Promise<boolean> {

  if (!url.isURL()) return false;

  try {

    url = new URL(url).href;
    if (!url) return false;

    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) return false;

    const type = response.headers.get("content-type") || "";
    return type.startsWith("image/");

  } catch (er) {
    return false;
  }

}