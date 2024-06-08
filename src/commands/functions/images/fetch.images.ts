import { env } from "process";
import { GoogleImagesResult, GoogleImagesResultItems } from "../../../@types/commands";

export default async function fetchImages(query: string, lr: string, gl: string): Promise<GoogleImagesResultItems[] | void> {

  if (!query?.length) return;

  try {
    const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${env.GOOGLE_IMAGES_KEY}&q=${query}&cx=${env.GOOGLE_IMAGES_CX}&filter=1&safe=active&searchType=image&num=10&lr=${lr}&gl=${gl}`);
    const result = await response.json() as GoogleImagesResult;
    return result?.items || [];
  } catch (_) { }

}