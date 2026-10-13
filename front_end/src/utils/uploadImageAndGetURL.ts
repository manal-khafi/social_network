import { uploadFile } from "../api/upload";

export async function uploadImageAndGetURL(file: File, folder: "avatars" | "covers") {
  return await uploadFile(file, folder);
}
