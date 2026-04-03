import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  addDoc
} from "firebase/firestore";
import { db } from "./firebase";
import type { BackendUser } from "./mockUser";

// Define strict types for our collections based on user requirements

export type FirestoreUser = {
  name: string;
  email: string;
  skillsOffered: string[];
  skillsWanted: string[];
  rating: number;
  sessionsCompleted: number;
};

export type FirestoreSession = {
  title: string;
  mentorId: string;
  learnerId: string;
  skill: string;
  date: string;
  status: "live" | "upcoming" | "completed";
};

export type ApiSession = {
  _id: string;
  title: string;
  mentor: BackendUser;
  learner: BackendUser;
  date: string;
  status: "live" | "upcoming" | "completed";
};

export type FirestoreResource = {
  title: string;
  description: string;
  tags: string[];
  authorId: string;
  sessionId?: string;
  image?: string;
};

// Users Collection Reference
const usersCollection = collection(db, "users");
const sessionsCollection = collection(db, "sessions");
const resourcesCollection = collection(db, "resources");

/**
 * Fetch all users
 */
export async function getUsers(): Promise<BackendUser[]> {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map((d) => {
    const data = d.data() as FirestoreUser;
    return {
      _id: d.id,
      name: data.name,
      email: data.email,
      skillsOffered: data.skillsOffered || [],
      skillsWanted: data.skillsWanted || [],
      // map rating/completed to UI requirements if necessary
    };
  });
}

/**
 * Fetch a single user by ID
 */
export async function getUserById(userId: string): Promise<BackendUser | null> {
  const docRef = doc(db, "users", userId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as FirestoreUser;
  return {
    _id: snapshot.id,
    name: data.name,
    email: data.email,
    skillsOffered: data.skillsOffered || [],
    skillsWanted: data.skillsWanted || []
  };
}

/**
 * Fetch mentors (Users who have offered skills)
 * Conditionally filter by a specific skill if provided
 */
export async function getMentors(skillFilter?: string): Promise<BackendUser[]> {
  const users = await getUsers();
  
  return users.filter(user => {
    const hasSkillsOffered = user.skillsOffered && user.skillsOffered.length > 0;
    if (!hasSkillsOffered) return false;
    
    if (skillFilter) {
      return user.skillsOffered!.some(skill => skill.toLowerCase() === skillFilter.toLowerCase());
    }
    return true;
  });
}

/**
 * Fetch all sessions and map mentor/learner references to full user objects
 */
export async function getSessions() {
  const snapshot = await getDocs(sessionsCollection);
  const sessionsData = snapshot.docs.map(_doc => ({ _id: _doc.id, ..._doc.data() as FirestoreSession }));
  
  // To avoid n+1 problem, cache users locally
  const allUsers = await getUsers();
  const usersMap = new Map(allUsers.map(u => [u._id, u]));
  
  return sessionsData.map(session => {
    const mentor = usersMap.get(session.mentorId) || {
      _id: session.mentorId, name: "Unknown Mentor", email: "", skillsOffered: [], skillsWanted: []
    };
    const learner = usersMap.get(session.learnerId) || {
      _id: session.learnerId, name: "Unknown Learner", email: "", skillsOffered: [], skillsWanted: []
    };
    
    return {
      _id: session._id,
      title: session.title || session.skill,
      mentor,
      learner,
      date: session.date,
      status: session.status
    };
  });
}

/**
 * Create a new session
 */
export async function createSession(sessionData: FirestoreSession) {
  const docRef = await addDoc(sessionsCollection, sessionData);
  return docRef.id;
}

/**
 * Fetch all resources, optionally map authors
 */
export async function getResources() {
  const snapshot = await getDocs(resourcesCollection);
  return snapshot.docs.map(d => ({
    _id: d.id,
    ...(d.data() as FirestoreResource)
  }));
}

/**
 * Add a new resource
 */
export async function addResource(resourceData: FirestoreResource) {
  const docRef = await addDoc(resourcesCollection, resourceData);
  return docRef.id;
}

/**
 * Fetch a single session by Id
 */
export async function getSessionById(sessionId: string): Promise<ApiSession> {
  const allSessions = await getSessions();
  const session = allSessions.find(s => s._id === sessionId);
  if (!session) throw new Error("Session not found");
  return session;
}
