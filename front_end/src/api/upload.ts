import api from "./axios";

export type UploadFolder = "avatars" | "covers" | "posts" | "stories" | "communities" | "voice";

/**
 * Uploads a file through the backend (POST /api/upload), which stores it in
 * Firebase Storage and returns its URL. Authorized by the backend JWT, so it
 * works for email/password users as well as Google / Facebook ones.
 */
export async function uploadFile(
  file: Blob,
  folder: UploadFolder,
  filename?: string
): Promise<string> {
  const formData = new FormData();
  formData.append("folder", folder);
  formData.append("file", file, filename ?? (file instanceof File ? file.name : "upload"));

  try {
    const { data } = await api.post<{ url: string }>("/upload", formData, {
      // The api instance defaults to JSON; let the browser set the multipart boundary.
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.url;
  } catch (err: any) {
    throw new Error(err?.response?.data?.message ?? "Upload failed");
  }
}
