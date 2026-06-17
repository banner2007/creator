import { initializeApp } from "firebase/app";
import { getStorage, ref, listAll, getDownloadURL, uploadBytes, deleteObject } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCRPTC-n4mqDR_nApCjjKt0fURFE8PJMrc",
  authDomain: "optimedia-studio.firebaseapp.com",
  projectId: "optimedia-studio",
  storageBucket: "optimedia-studio.firebasestorage.app",
  messagingSenderId: "773497522944",
  appId: "1:773497522944:web:60f2a39be5e6b8318801e5"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export { ref, listAll, getDownloadURL, uploadBytes, deleteObject };
