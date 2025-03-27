import { WebSocketServer } from "ws";
import { ThermocoupleDevice } from "./pyro";
import { WiFiControl } from "./network";

// Initialize devices
const devices: { [key: string]: ThermocoupleDevice } = {
  usb0: new ThermocoupleDevice("/dev/ttyUSB0"),
  usb1: new ThermocoupleDevice("/dev/ttyUSB1"),
};

// Initialize the WebSocket server on port 9999
const wss = new WebSocketServer({ port: 1113 });

const network = new WiFiControl();

console.log("WebSocket server started on ws://localhost:1113");

const temp: null | number = null;
// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (message) => {
    let data: any;
    try {
      data = JSON.parse(message.toString());
      console.log("Received:", data);

      const { command, deviceId, params } = data;

      let device: ThermocoupleDevice | null = null;
      const allowedCommandsForNullDevice = [
        "accessPoint",
        "accessPointDetails",
        "wifiClient",
        "networkStatus",
        "checkNetworkMode",
        "networkDevices",
        "get  Temp",
      ];

      if (deviceId === null) {
        if (!allowedCommandsForNullDevice.includes(command)) {
          throw new Error(
            `Device is null. Command '${command}' is not allowed without a valid deviceId.`
          );
        }
      } else {
        if (!devices[deviceId]) {
          throw new Error(
            `Invalid or missing deviceId. Use 'usb0' or 'usb1'. Received: ${deviceId}`
          );
        }
        device = devices[deviceId];
      }
      const response: any = {
        command,
        deviceId,
        status: "success",
        data: null,
      };

      switch (command) {
        case "open":
          await device.open();
          response.data = `Port ${deviceId} opened`;
          break;

        case "readThermocoupleType":
          response.data = await device.readThermocoupleType();
          break;

        case "writeThermocoupleType":
          if (typeof params?.type !== "number")
            throw new Error("Type parameter required");
          await device.writeThermocoupleType(params.type);
          response.data = `Type ${params.type} set on ${deviceId}`;
          break;

        case "writeTypeK":
          await device.writeTypeK();
          response.data = `Type K set on ${deviceId}`;
          break;

        case "writeTypeS":
          await device.writeTypeS();
          response.data = `Type S set on ${deviceId}`;
          break;

        case "writeTypeN":
          await device.writeTypeN();
          response.data = `Type N set on ${deviceId}`;
          break;

        case "setTemperatureAccuracy":
          if (typeof params?.accuracy !== "number")
            throw new Error("Accuracy parameter required");
          await device.setTemperatureAccuracy(params.accuracy);
          response.data = `Accuracy set to ${params.accuracy} on ${deviceId}`;
          break;

        case "startMonitoring":
          await device.startMonitoring();
          response.data = `Monitoring started on ${deviceId}`;
          device.on("temperature", (temp: string) => {
            if (deviceId)
              ws.send(
                JSON.stringify({
                  command: "temperatureUpdate",
                  deviceId,
                  status: "success",
                  data: temp,
                })
              );
          });
          break;

        case "stopMonitoring":
          device.stopMonitoring();
          response.data = `Monitoring stopped on ${deviceId}`;
          break;

        case "close":
          await device.close();
          response.data = `Port ${deviceId} closed`;
          break;

        case "getTemp":
          response.data = {
            temp1: devices.usb0.temp,
            temp2: devices.usb1.temp,
          };
          break;

        case "accessPoint":
          await network.startAP();
          response.data = JSON.stringify(await network.getAPConfig());
          break;

        case "accessPointDetails":
          response.data = JSON.stringify(await network.getAPConfig());
          break;

        case "stopAP":
          await network.stopAP();
          response.data = JSON.stringify(await network.getAPConfig());
          break;

        case "wifiConnect":
          await network.connectWiFi(params.ssid, params.password);
          response.data = JSON.stringify(await network.listNetworkDevices());
          break;

        case "networkStatus":
          response.data = JSON.stringify(await network.getAPConfig());
          break;

        case "checkNetworkMode":
          response.data = JSON.stringify(await network.checkMode());
          break;

        case "networkDevices":
          response.data = JSON.stringify(await network.listNetworkDevices());
          break;

        default:
          throw new Error(`Unknown command: ${command}`);
      }

      ws.send(JSON.stringify(response));
    } catch (err) {
      console.error("Error processing command:", err);
      ws.send(
        JSON.stringify({
          command: data.command,
          deviceId: data.deviceId,
          status: "error",
          data: (err as Error).message,
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    for (const deviceId in devices) {
      devices[deviceId].stopMonitoring();
      devices[deviceId]
        .close()
        .catch((err) => console.error(`Error closing ${deviceId}:`, err));
    }
  });
});
