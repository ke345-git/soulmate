; ============================================
; SoulMate Windows 安装程序
; 使用 NSIS 创建
; ============================================

!include "MUI2.nsh"

; 基本信息
Name "SoulMate"
OutFile "SoulMate-Setup.exe"
InstallDir "$PROGRAMFILES\SoulMate"
RequestExecutionLevel admin

; 界面设置
!define MUI_ABORTWARNING
; 注意：favicon.ico 不存在时，NSIS 使用默认图标
; 如需自定义图标，将 favicon.svg 转换为 favicon.ico 放入 frontend/public/

; 安装页面
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; 卸载页面
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "SimpChinese"

Section "Install"
  SetOutPath "$INSTDIR"

  ; 主程序
  File "SoulMate.exe"
  File "..\.env.example"

  ; 创建启动脚本
  FileOpen $0 "$INSTDIR\启动SoulMate.bat" w
  FileWrite $0 "@echo off$\r$\n"
  FileWrite $0 "chcp 65001 >nul$\r$\n"
  FileWrite $0 "echo 💝 SoulMate 启动中...$\r$\n"
  FileWrite $0 "echo 浏览器将自动打开 http://localhost:8000$\r$\n"
  FileWrite $0 "echo 请保持此窗口打开$\r$\n"
  FileWrite $0 'start "" "$INSTDIR\SoulMate.exe"$\r$\n'
  FileClose $0

  ; 开始菜单快捷方式
  CreateDirectory "$SMPROGRAMS\SoulMate"
  CreateShortcut "$SMPROGRAMS\SoulMate\SoulMate.lnk" "$INSTDIR\启动SoulMate.bat" "" "$INSTDIR\SoulMate.exe" 0
  CreateShortcut "$SMPROGRAMS\SoulMate\卸载 SoulMate.lnk" "$INSTDIR\uninstall.exe"

  ; 桌面快捷方式
  CreateShortcut "$DESKTOP\SoulMate.lnk" "$INSTDIR\启动SoulMate.bat" "" "$INSTDIR\SoulMate.exe" 0

  ; 卸载程序
  WriteUninstaller "$INSTDIR\uninstall.exe"

  ; 注册表（添加/删除程序）
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SoulMate" "DisplayName" "SoulMate"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SoulMate" "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SoulMate" "DisplayIcon" "$INSTDIR\SoulMate.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SoulMate" "Publisher" "SoulMate"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SoulMate" "DisplayVersion" "1.1.1"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SoulMate" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SoulMate" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\SoulMate.exe"
  Delete "$INSTDIR\启动SoulMate.bat"
  Delete "$INSTDIR\.env.example"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR"

  Delete "$SMPROGRAMS\SoulMate\SoulMate.lnk"
  Delete "$SMPROGRAMS\SoulMate\卸载 SoulMate.lnk"
  RMDir "$SMPROGRAMS\SoulMate"

  Delete "$DESKTOP\SoulMate.lnk"

  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SoulMate"
SectionEnd
