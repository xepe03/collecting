# GitHub 업로드 방법

## 1. Git 설치
Git이 없다면 [git-scm.com](https://git-scm.com)에서 설치하세요.

## 2. GitHub에서 저장소 생성
1. [github.com/xepe03](https://github.com/xepe03) 접속
2. **New repository** 클릭
3. Repository name: `collecting` (또는 원하는 이름)
4. **Create repository** (README 추가 안 함)

## 3. 터미널에서 실행

```powershell
cd "c:\Users\jinmi\OneDrive\Desktop\collecting"

# Git 초기화
git init

# 모든 파일 추가 (.env는 .gitignore에 있어 제외됨)
git add .

# 첫 커밋
git commit -m "Initial commit: 수집품 관리 앱"

# GitHub 원격 저장소 연결 (저장소 이름을 collecting으로 생성했다면)
git remote add origin https://github.com/xepe03/collecting.git

# 푸시
git branch -M main
git push -u origin main
```

## 4. 저장소 이름이 다르다면
예: `xepe03` 저장소로 올리는 경우
```powershell
git remote add origin https://github.com/xepe03/xepe03.git
```

## 주의사항
- `.env` 파일은 `.gitignore`에 포함되어 있어 **업로드되지 않습니다** (Firebase 키 보호)
- 배포 시 `.env`를 별도로 설정해야 합니다
