
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { Player, Fixture } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyCLrYmhL9bztbArYelFwSmFITC5axVyCVQ",
  authDomain: "pgd-fc.firebaseapp.com",
  projectId: "pgd-fc",
  storageBucket: "pgd-fc.firebasestorage.app",
  messagingSenderId: "675884462836",
  appId: "1:675884462836:web:90ccb46c8fa10ceadaa4a1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Multiple tabs open, persistence limited.");
    }
  });
} catch (e) {
  console.error("Persistence setup failed:", e);
}

const TOURNAMENT_DOC_ID = "registry_v1";

export interface TournamentState {
  players: Player[];
  fixtures: Fixture[];
  lastUpdated: number;
}

export const subscribeToTournament = (
  callback: (state: TournamentState) => void,
  onError?: (error: any) => void
) => {
  return onSnapshot(
    console.log("SNAPSHOT APPLIED", snap.exists(), snap.data()?.fixtures?.length);
    doc(db, "tournament", TOURNAMENT_DOC_ID), 
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as TournamentState);
      }
    },
    (error) => {
      console.error("Firestore Sync Lost:", error);
      if (onError) onError(error);
    }
  );
};

export const fetchRemoteState = async (): Promise<TournamentState | null> => {
  try {
    const docSnap = await getDoc(doc(db, "tournament", TOURNAMENT_DOC_ID));
    return docSnap.exists() ? (docSnap.data() as TournamentState) : null;
  } catch (error) {
    console.error("Fetch failed:", error);
    throw error;
  }
};

export const updateRemoteState = async (players: Player[], fixtures: Fixture[]) => {
  try {
    await setDoc(doc(db, "tournament", TOURNAMENT_DOC_ID), {
      players,
      fixtures,
      lastUpdated: Date.now()
    }, { merge: false });
    return true;
  } catch (error: any) {
    console.error("Firebase Update Error:", error);
    alert(`SAVE FAILED: ${error.code}\n${error.message}`);
    throw error;
  }
};
