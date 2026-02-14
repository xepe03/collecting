# PowerShell 실행정책 우회 - cmd로 npm 실행
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
cmd /c "npm run dev"
