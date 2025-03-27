#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ELECTRON_PATH="$SCRIPT_DIR/out/pyro-linux-arm64/pyro"

# Create systemd service file content with fullscreen flag
SERVICE_CONTENT="[Unit]
Description=Electron App Auto Start
After=graphical.target

[Service]
ExecStart=${ELECTRON_PATH}  --fullscreen
WorkingDirectory=${ELECTRON_PATH}
Restart=always
User=pi
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/pi/.Xauthority

[Install]
WantedBy=graphical.target"

# Create service file
SERVICE_NAME="electron-app.service"
SERVICE_PATH="/etc/systemd/system/$SERVICE_NAME"

# Write service file
echo "$SERVICE_CONTENT" | sudo tee "$SERVICE_PATH" > /dev/null

# Set proper permissions
sudo chmod 644 "$SERVICE_PATH"

# Reload systemd daemon
sudo systemctl daemon-reload

# Enable the service to start on boot
sudo systemctl enable "$SERVICE_NAME"

# Start the service immediately
sudo systemctl start "$SERVICE_NAME"

echo "Electron app service has been configured to start in fullscreen mode"
echo "Service file created at: $SERVICE_PATH"
echo "To check status: systemctl status $SERVICE_NAME"
echo "To stop: sudo systemctl stop $SERVICE_NAME"
echo "To disable: sudo systemctl disable $SERVICE_NAME"