import admin from "firebase-admin";

// 🔥 Lire la variable d'environnement
// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);

// Initialisation Firebase
/*
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "exam9-1.appspot.com", // remplace par ton vrai bucket
});
*/

// const bucket = admin.storage().bucket();
const bucket: any = null;

export { admin, bucket };
