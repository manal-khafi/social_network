// front_end/src/utils/authUtils.ts

export interface FirebaseUserSafe {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerId: string | null;
}

export const toSafeUser = (
  firebaseUser: import("firebase/auth").User | null
): FirebaseUserSafe | null => {
  if (!firebaseUser) return null;

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    providerId: firebaseUser.providerData?.[0]?.providerId ?? null,
  };
};
