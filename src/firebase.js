import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { 
  getAuth, 
  signInAnonymously, 
  signInWithPopup,
  GoogleAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  deleteUser
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)

const googleProvider = new GoogleAuthProvider()

// 익명 로그인
export function initAuth() {
  return signInAnonymously(auth)
}

// Google 로그인
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  } catch (error) {
    console.error('Google 로그인 실패:', error)
    throw error
  }
}

// 익명 계정을 Google 계정으로 연결
export async function linkAnonymousWithGoogle() {
  try {
    const user = auth.currentUser
    if (!user || !user.isAnonymous) {
      throw new Error('익명 계정이 아닙니다')
    }
    
    // Google 로그인 팝업
    const result = await signInWithPopup(auth, googleProvider)
    const credential = GoogleAuthProvider.credentialFromResult(result)
    
    if (!credential) {
      throw new Error('Google 인증 정보를 가져올 수 없습니다')
    }
    
    // 익명 계정에 Google 계정 연결
    // 주의: linkWithCredential은 같은 UID를 유지하므로
    // 기존 데이터가 그대로 유지됩니다
    await linkWithCredential(user, credential)
    
    // 연결 후 현재 사용자 정보 반환
    return auth.currentUser
  } catch (error) {
    console.error('Google 계정 연결 실패:', error)
    
    // 이미 Google 계정으로 로그인된 경우 처리
    if (error.code === 'auth/credential-already-in-use') {
      throw new Error('이미 다른 계정에서 사용 중인 Google 계정입니다')
    }
    
    throw error
  }
}

// 로그아웃
export async function signOut() {
  return firebaseSignOut(auth)
}

// 회원탈퇴 (사용자 계정 삭제)
export async function deleteUserAccount() {
  const user = auth.currentUser
  if (!user) {
    throw new Error('로그인된 사용자가 없습니다')
  }
  return deleteUser(user)
}

export { onAuthStateChanged }
