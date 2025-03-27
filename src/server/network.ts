import { exec } from "child_process";
import * as fs from "fs";

export class WiFiControl {
  /**
   * Starts the Wi-Fi Access Point (AP) mode
   */
  public async startAP(): Promise<string> {
    return new Promise((resolve, reject) => {
      exec("sudo ./scripts/switch_mode.sh ap", (err, stdout, stderr) => {
        if (err) reject(`Error starting AP: ${stderr}`);
        else resolve("Wi-Fi Access Point Started!");
      });
    });
  }

  /**
   * Stops the Access Point and switches to Wi-Fi client mode
   */
  public async stopAP(): Promise<string> {
    return new Promise((resolve, reject) => {
      exec("sudo ./scripts/switch_mode.sh client", (err, stdout, stderr) => {
        if (err) reject(`Error stopping AP: ${stderr}`);
        else resolve("Wi-Fi Access Point Stopped!");
      });
    });
  }

  /**
   * Connects to a specified Wi-Fi network
   * @param ssid - The SSID of the Wi-Fi network
   * @param password - The Wi-Fi password
   */
  public async connectWiFi(ssid: string, password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const config = `
network={
  ssid="${ssid}"
  psk="${password}"
}
`;
      fs.writeFileSync("/etc/wpa_supplicant/wpa_supplicant.conf", config);

      exec(
        "sudo systemctl restart wpa_supplicant && sudo dhclient wlan0",
        (err) => {
          if (err) reject(`Error connecting to Wi-Fi: ${err}`);
          else resolve(`Connected to ${ssid}`);
        }
      );
    });
  }

  /**
   * Checks the current mode (AP or Client)
   */
  public async checkMode(): Promise<string> {
    return new Promise((resolve, reject) => {
      exec("systemctl is-active hostapd", (err, stdout) => {
        if (err) reject("Error checking mode");
        resolve(stdout.trim() === "active" ? "AP Mode" : "Client Mode");
      });
    });
  }

  /**
   * Lists available network interfaces with their IP addresses
   */
  public async listNetworkDevices(): Promise<
    { interface: string; ip: string | null }[]
  > {
    return new Promise((resolve, reject) => {
      exec("ip -o addr show | awk '{print $2, $4}'", (err, stdout) => {
        if (err) {
          reject(`Error listing network devices: ${err}`);
        } else {
          const devices = stdout
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map((line) => {
              const [iface, ip] = line.split(" ");
              return {
                interface: iface,
                ip: ip ? ip.split("/")[0] : null, // Extract IP without subnet mask
              };
            });

          resolve(devices);
        }
      });
    });
  }

  public async getAPConfig(): Promise<{
    ssid: string;
    password: string | null;
  }> {
    return new Promise((resolve, reject) => {
      const configPath = "/etc/hostapd/hostapd.conf";
      if (!fs.existsSync(configPath)) {
        return reject("hostapd.conf not found.");
      }

      const config = fs.readFileSync(configPath, "utf-8");
      const ssidMatch = config.match(/ssid=(.+)/);
      const passwordMatch = config.match(/wpa_passphrase=(.+)/);

      const ssid = ssidMatch ? ssidMatch[1] : null;
      const password = passwordMatch ? passwordMatch[1] : null;

      if (!ssid) {
        reject("SSID not found in hostapd.conf");
      } else {
        resolve({ ssid, password });
      }
    });
  }

  /**
   * Checks if the AP is secured (requires a password) or open
   */
  public async isAPSecured(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const configPath = "/etc/hostapd/hostapd.conf";
      if (!fs.existsSync(configPath)) {
        return reject("hostapd.conf not found.");
      }

      const config = fs.readFileSync(configPath, "utf-8");
      const wpaMatch = config.match(/wpa=(\d+)/);
      const requiresPassword = wpaMatch && parseInt(wpaMatch[1], 10) > 0;

      resolve(requiresPassword);
    });
  }
}
