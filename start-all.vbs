Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d C:\Users\3lisenpai\Documents\OpenCode\CrazyTeam && node server.js", 0, False
WScript.Sleep 3000
WshShell.Run "cmd /c C:\Users\3lisenpai\.portbuddy\portbuddy.exe 3001", 0, False
