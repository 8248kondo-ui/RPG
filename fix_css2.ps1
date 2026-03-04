$path = 'c:\Users\PC_User\Desktop\RPG-main\RPG\css\style.css'
$content = Get-Content $path -Encoding Unicode -Raw
# skill-bar の left: 15px; を left: 55px; に変更します。
$content = $content.Replace('left: 15px;', 'left: 55px;')
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::Unicode)
Write-Host "Done: skill-bar position changed to left 55px"
