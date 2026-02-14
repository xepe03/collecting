import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

/**
 * Firebase Storage에 이미지 업로드 (이미지 형식만 허용)
 * 경로: users/{userId}/uploads/{timestamp}_{filename}
 * @param {File} file - 업로드할 이미지 파일
 * @param {string} userId - 사용자 ID
 * @returns {Promise<string>} 다운로드 URL
 */
export async function uploadFile(file, userId) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('이미지 파일만 업로드 가능합니다 (jpg, png, gif, webp)')
  }
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = `users/${userId}/uploads/${timestamp}_${safeName}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}
