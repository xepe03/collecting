# Collecting

React + Vite + Firebase 기반 수집품 관리 사이트 (포켓몬 카드, 프라모델 등)

## Firebase 설정

### 1. 프로젝트 설정
1. [Firebase 콘솔](https://console.firebase.google.com) → 프로젝트 선택
2. **프로젝트 설정** → **일반** 탭 → `firebaseConfig` 복사
3. `.env` 파일 생성:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 2. 익명 인증 활성화
- **Authentication** → **Sign-in method** → **익명** → 사용 설정

### 3. Firestore 보안 규칙
- **Firestore Database** → **규칙** 탭 (프로젝트 루트 `firestore.rules` 참고)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shared/{token} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Storage 보안 규칙 (이미지/파일 업로드)
- **Storage** → **규칙** 탭

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. 데이터 구조
- `users/{userId}/collections/{collectionId}` - 컬렉션 (name, parentId, children[], items[])
- `users/{userId}/items/{itemId}` - 아이템 (name, image, fields{}, files[])
- `shared/{token}` - 공유 스냅샷 (읽기 전용, 링크로 접근)
- 업로드 파일: `users/{userId}/uploads/{timestamp}_{filename}` (Firebase Storage)

유저별로 데이터가 분리되어 있어, 나중에 Google 로그인 추가 시 `request.auth.uid`로 자동 연결됩니다.

## 시작하기

```bash
npm install
npm run dev
```

개발 서버: http://localhost:5173

## 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run preview` - 빌드 결과 미리보기
