#!/bin/bash
# This script updates the program version that is shown in the frontend. You can execute this script before a build
# with your IDE run/debug configuration or execute it manually before manual build.
# https://man7.org/linux/man-pages/man1/date.1.html
dateAsVersion=$(date +"%G%m%d%H%M%S")
lineStringReplacement="VERSION=${dateAsVersion}"
fileToBeEdited=".env.defaults"
lineToBeReplaced="2"
# https://stackoverflow.com/questions/11145270/how-to-replace-an-entire-line-in-a-text-file-by-line-number
# update version number, line number 2 in file .env.defaults will replaced
sed -i "${lineToBeReplaced}s/.*/${lineStringReplacement}/" ${fileToBeEdited}