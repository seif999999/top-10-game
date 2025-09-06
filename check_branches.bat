@echo off
echo ========================================
echo CHECKING ALL BRANCHES AND CHANGES
echo ========================================
echo.

echo Current branch:
git branch --show-current
echo.

echo All local branches:
git branch
echo.

echo All remote branches:
git branch -r
echo.

echo Current commit hash:
git rev-parse HEAD
echo.

echo Checking if main branch has the same commit:
git rev-parse main
echo.

echo Checking if origin/main has the same commit:
git rev-parse origin/main
echo.

echo Checking if origin/fix/multiplayer-gameflow has the same commit:
git rev-parse origin/fix/multiplayer-gameflow
echo.

echo ========================================
echo BRANCH COMPARISON COMPLETE
echo ========================================
pause
