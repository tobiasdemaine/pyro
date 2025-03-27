#!/bin/bash

# Variables
SSID="RaspberryPi-AP"  # Change this to your desired AP SSID
PASSWORD="raspberry123" # Change this to your desired AP password
WIFI_INTERFACE="wlan0"
AP_IP="192.168.4.1"

# Ensure script runs as root
if [[ $EUID -ne 0 ]]; then
   echo "Please run this script as root: sudo ./setup_wifi.sh"
   exit 1
fi

echo "Updating system and installing necessary packages..."
apt update && apt install -y hostapd dnsmasq netfilter-persistent iptables-persistent

echo "Stopping services to configure them..."
systemctl stop hostapd
systemctl stop dnsmasq

# Configure a static IP for wlan0 in AP mode
echo "Configuring static IP for AP mode..."
cat <<EOF > /etc/dhcpcd.conf
interface $WIFI_INTERFACE
    static ip_address=$AP_IP/24
    nohook wpa_supplicant
EOF

# Configure DHCP server (dnsmasq)
echo "Configuring dnsmasq..."
cat <<EOF > /etc/dnsmasq.conf
interface=$WIFI_INTERFACE
dhcp-range=192.168.4.2,192.168.4.100,255.255.255.0,24h
EOF

# Configure hostapd (AP mode)
echo "Configuring hostapd..."
cat <<EOF > /etc/hostapd/hostapd.conf
interface=$WIFI_INTERFACE
ssid=$SSID
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=$PASSWORD
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP
EOF

# Point hostapd to config file
echo "DAEMON_CONF=\"/etc/hostapd/hostapd.conf\"" > /etc/default/hostapd

# Enable NAT for internet sharing
echo "Enabling NAT for internet sharing..."
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
sh -c "iptables-save > /etc/iptables/rules.v4"

# Enable IP forwarding
echo "Configuring IP forwarding..."
sed -i 's/#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/' /etc/sysctl.conf
sysctl -p

# Backup wpa_supplicant for client mode
cp /etc/wpa_supplicant/wpa_supplicant.conf /etc/wpa_supplicant/wpa_supplicant.conf.client

echo "Enabling services..."
systemctl enable hostapd
systemctl enable dnsmasq
systemctl enable netfilter-persistent

echo "Setup complete! Use 'switch_mode.sh' to toggle between AP and Wi-Fi client mode."
