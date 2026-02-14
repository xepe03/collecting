@echo off
chcp 65001 >nul
echo GitHub 업로드 스크립트
echo.

if not exist .git (
    echo Git 초기화 중...
    git init
    git add .
    git commit -m "Initial commit: 수집품 관리 앱"
) else (
    echo 변경사항 추가 중...
    git add .
    git status
    set /p msg="커밋 메시지 (Enter=기본): "
    if "%msg%"=="" set msg=Update
    git commit -m "%msg%"
)

git remote remove origin 2>nul
git remote add origin https://github.com/xepe03/collecting.git
git branch -M main
echo.
echo 푸시 중...
git push -u origin main

echo.
echo 완료!
pause
