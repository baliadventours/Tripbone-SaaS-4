import { db } from './src/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

async function test() {
  try {
    const q1 = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const snap1 = await getDocs(q1);
    console.log('Query 1 size:', snap1.size);
  } catch (e: any) {
    console.error('Query 1 error:', e.message);
  }
  try {
    const q2 = query(collection(db, 'posts'), where('status', 'in', ['published', 'active']));
    const snap2 = await getDocs(q2);
    console.log('Query 2 size:', snap2.size);
  } catch (e: any) {
    console.error('Query 2 error:', e.message);
  }
  process.exit(0);
}
test();
