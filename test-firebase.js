import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const envVars = fs.readFileSync('.env.example', 'utf-8').split('\n'); // wait, I don't have .env! I have to read the real Firebase config.
