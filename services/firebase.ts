
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { Player, Fixture, KnockoutMatch } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyCLrYmhL9bztbArYelFwSmFITC5axVyCVQ",
  authDomain: "pgd-fc.firebaseapp.com",
  projectId: "pgd-fc",
  storageBucket: "pgd-fc.firebasestorage.app",
  messagingSenderId: "675884462836",
  appId: "1:675884462836:web:90ccb46c8fa10ceadaa4a1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

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
  knockoutMatches?: KnockoutMatch[];
  lastUpdated: number;
}

export const subscribeToTournament = (
  callback: (state: TournamentState) => void,
  onError?: (error: any) => void
) => {
  return onSnapshot(
    doc(db, "tournament", TOURNAMENT_DOC_ID),
    (docSnap) => {
      console.log("SNAPSHOT APPLIED", docSnap.exists(), docSnap.data()?.fixtures?.length);
      const data = docSnap.data() as TournamentState | undefined;
      if (data) {
        callback(data);
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

export const updateRemoteState = async (players: Player[], fixtures: Fixture[], knockoutMatches?: KnockoutMatch[]) => {
  try {
    const data: any = {
      players,
      fixtures,
      lastUpdated: Date.now()
    };
    if (knockoutMatches !== undefined) {
      data.knockoutMatches = knockoutMatches;
    }
    await setDoc(doc(db, "tournament", TOURNAMENT_DOC_ID), data, { merge: true });
    return true;
  } catch (error: any) {
    console.error("Firebase Update Error:", error);
    alert(`SAVE FAILED: ${error.code}\n${error.message}`);
    throw error;
  }
};

export const updateKnockoutMatches = async (knockoutMatches: KnockoutMatch[]) => {
  try {
    await setDoc(doc(db, "tournament", TOURNAMENT_DOC_ID), {
      knockoutMatches,
      lastUpdated: Date.now()
    }, { merge: true });
    return true;
  } catch (error: any) {
    console.error("Firebase Knockout Update Error:", error);
    alert(`KNOCKOUT SAVE FAILED: ${error.code}\n${error.message}`);
    throw error;
  }
};

export const updateSeedVersion = async (version: string) => {
  try {
    await setDoc(doc(db, "tournament", TOURNAMENT_DOC_ID), {
      seedVersion: version,
      lastUpdated: Date.now()
    }, { merge: true });
    return true;
  } catch (error: any) {
    console.error("Firebase Seed Version Update Error:", error);
    throw error;
  }
};
