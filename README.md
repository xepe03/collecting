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

권한 모델:
- **Owner**: read + write
- **Others (로그인X 포함)**: read only (단, `visibility: "public"`일 때만)
- **Private 컬렉션**: 오너만 read

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 공유 컬렉션 (실시간 동기화)
    match /collections/{collectionId} {
      // 오너만 write
      allow write: if request.auth != null && request.auth.uid == resource.data.ownerUid;
      // public이면 누구나 read (로그인 여부 상관 없음)
      // private이면 오너만 read
      allow read: if resource.data.visibility == 'public' 
        || (request.auth != null && request.auth.uid == resource.data.ownerUid);
    }
    
    // 공유 컬렉션의 아이템들
    match /collections/{collectionId}/items/{itemId} {
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/collections/$(collectionId)).data.ownerUid == request.auth.uid;
      allow read: if get(/databases/$(database)/documents/collections/$(collectionId)).data.visibility == 'public'
        || (request.auth != null && 
          get(/databases/$(database)/documents/collections/$(collectionId)).data.ownerUid == request.auth.uid);
    }
    
    // 사용자별 개인 컬렉션
    match /users/{userId}/collections/{collectionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 사용자별 개인 아이템
    match /users/{userId}/items/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Storage 보안 규칙 (이미지/파일 업로드)
- **Storage** → **규칙** 탭에서 아래 규칙을 복사하여 붙여넣기
- 또는 Firebase CLI 사용: `firebase deploy --only storage`

**⚠️ 중요: Storage가 활성화되어 있어야 합니다!**
- Firebase 콘솔 → **Storage** → **시작하기** 클릭
- 프로덕션 모드로 시작 (테스트 모드 아님)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 사용자별 업로드 파일
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

프로젝트 루트에 `storage.rules` 파일이 있으니 참고하세요.

### 5. 데이터 구조

**개인 컬렉션:**
- `users/{userId}/collections/{collectionId}` - 컬렉션
  - 필드: `name`, `parentId`, `children[]`, `items[]`, `ownerUid`, `visibility` ('public' | 'private'), `updatedAt`, `thumbnail`, `thumbnailType`, `iconId`, `tag`, `memo`, `itemFields[]`
- `users/{userId}/items/{itemId}` - 아이템
  - 필드: `name`, `image`, `fields{}`, `files[]`

**공유 컬렉션 (실시간 동기화):**
- `collections/{collectionId}` - 공유 컬렉션
  - 필드: `ownerUid`, `visibility` ('public' | 'private'), `name`, `itemFields[]`, `updatedAt`, 기타 컬렉션 메타데이터
- `collections/{collectionId}/items/{itemId}` - 공유 컬렉션의 아이템들
  - 필드: `name`, `image`, `fields{}`

**파일 업로드:**
- `users/{userId}/uploads/{timestamp}_{filename}` (Firebase Storage)

**권한 모델:**
- 컬렉션 문서에 `ownerUid`와 `visibility` 필드만 있으면 됨
- 오너만 write 가능
- `visibility: "public"`이면 누구나 read (로그인 여부 상관 없음)
- `visibility: "private"`이면 오너만 read

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
