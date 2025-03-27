# Pyro

An Electron based Thermocouple/Pyrometer App for measuring kiln temperatures desing to be used with a Raspberry Pi with touch screen.

## Overview

This React/Electron app was developed to use a Raspberry Pi with a 320 X 240 touch screen & [BrightWin Intelligent Thermocouple PT100 Temperature Transmitter](https://www.brightwintech.com/product/intelligent-thermocouple-pt100-temperature-transmitter/) via its uart/serial to USB connector as a standalone device to log and transmit temperature data to a React Native App via wifi and websockets. It can work as a wifi access point or join existing wifi networks.

## Features

- **Dual Thermocouples:** Mix and Match common Pottery thermocouples K, S, & N.
- **Wifi Connect:** Stream temperature data to other dvices over TCP/IP via web sockets
- **Graph Temperature:** Realtime graphing of temperatures.

## Installation

Clone the repository to your Raspberry Pi:

```
git clone https://github.com/yourusername/pyro.git
```

Then, install:

```
npm install
npm run package

./scripts/setup_wifi.sh
./scripts/auto_load.sh
```

Now reboot machine and
