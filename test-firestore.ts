import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';

const app = initializeApp({
  projectId: "gen-lang-client-0785892115",
  apiKey: "AIzaSyA8A5zd1BtslU0s65dGRnFkLearGvZLDZk"
});
const db = getFirestore(app, "ai-studio-tripbonesaas-bc73f611-b9f1-4175-a949-14e52d815420");

async function test() {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  try {
    const snap = await getDocs(q);
    console.log("Total docs in posts ordered:", snap.size);
  } catch(e: any) {
    console.log("Error:", e.message);
  }
  process.exit(0);
}
test();
