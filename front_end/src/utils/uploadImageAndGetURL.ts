import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage, auth } from "../config/firebaseConfig";

export async function uploadImageAndGetURL(file: File, folder: "avatars" | "covers") {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not logged in");

  const fileRef = ref(storage, `users/${uid}/${folder}/${Date.now()}-${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}
