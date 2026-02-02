import admin from "firebase-admin";

let bucket: admin.storage.Bucket | undefined;

try {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (bucketName && serviceAccountString) {
    const serviceAccount = JSON.parse(serviceAccountString);

    // Manually format the private_key to replace escaped newlines
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(
        /\\n/g,
        "\n"
      );
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: bucketName,
      });
      bucket = admin.storage().bucket();
      console.log("Firebase Admin SDK initialized successfully.");
    }
  } else {
    console.warn(
      "Firebase Admin SDK not initialized. Missing FIREBASE_STORAGE_BUCKET or FIREBASE_SERVICE_ACCOUNT environment variables."
    );
  }
} catch (error: any) {
  console.error("Failed to initialize Firebase Admin SDK:", error.message);
}

export { admin, bucket };
