#!/bin/bash

WIFI_INTERFACE="wlan0"

if [ "$1" == "ap" ]; then
    echo "Switching to AP mode..."
    systemctl stop wpa_supplicant
    systemctl start hostapd
    systemctl start dnsmasq
    echo "Access Point mode activated."
elif [ "$1" == "client" ]; then
    echo "Switching to Wi-Fi client mode..."
    systemctl stop hostapd
    systemctl stop dnsmasq
    systemctl start wpa_supplicant
    echo "Wi-Fi client mode activated."
else
    echo "Usage: sudo ./switch_mode.sh ap | client"
fi
