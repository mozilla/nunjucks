@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\bundle" %*
) ELSE (
  node  "%~dp0\bundle" %*
)
