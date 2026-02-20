#!/bin/bash
cd /home/kburki/KTOO/ktt
echo "Starting KTOO Time Tracker..."
pm2 start "npx serve -s build -l 3000" --name ktt
pm2 save
echo "App started on http://192.168.101.152:3000"
