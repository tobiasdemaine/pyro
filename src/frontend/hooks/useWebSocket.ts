import { useEffect, useState } from "react";

interface WebSocketResponse {
  command: string;
  deviceId: string;
  status: "success" | "error";
  data: string;
}

const useWebSocket = (deviceId: string | null) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [temperature, setTemperature] = useState<string | null>(null);
  const [isPortOpen, setIsPortOpen] = useState(false);
  const [type, setType] = useState<string | null>(null);
  const [logging, setLogging] = useState<boolean>(false);
  const [network, setNetwork] = useState<any>({
    networkDetails: null,
    networkStatus: null,
    apDetails: null,
    networkMode: null,
  });
  useEffect(() => {
    const websocket = new WebSocket("ws://127.0.0.1:1113");
    setWs(websocket);

    websocket.onopen = () => console.log(`WebSocket connected for ${deviceId}`);
    websocket.onmessage = (event) => {
      const data: WebSocketResponse = JSON.parse(event.data);
      if (data.deviceId === deviceId) {
        if (data.command === "temperatureUpdate") {
          setTemperature(data.data);
        } else if (data.command === "open" && data.status === "success") {
          setIsPortOpen(true);
        } else if (data.command === "close" && data.status === "success") {
          setIsPortOpen(false);
        } else if (
          data.command === "readThermocoupleType" &&
          data.status === "success"
        ) {
          setType(data.data);
        } else if (
          data.command === "networkDevices" &&
          data.status === "success"
        ) {
          setNetwork({
            ...network,
            networkDetails: data.data,
          });
        } else if (
          data.command === "networkStatus" &&
          data.status === "success"
        ) {
          setNetwork({
            ...network,
            networkStatus: data.data,
          });
        } //
        else if (
          data.command === "accessPointDetails" &&
          data.status === "success"
        ) {
          setNetwork({
            ...network,
            apDetails: data.data,
          });
        } else if (
          data.command === "accessPoint" &&
          data.status === "success"
        ) {
          setNetwork({
            ...network,
            apDetails: data.data,
          });
        } else if (data.command === "stopAP" && data.status === "success") {
          setNetwork({
            ...network,
            apDetails: null,
          });
        } else if (
          data.command === "wifiConnect" &&
          data.status === "success"
        ) {
          setNetwork({
            ...network,
            networkDetails: data.data,
            apDetails: null,
          });
        } else if (
          data.command === "checkNetworkMode" &&
          data.status === "success"
        ) {
          setNetwork({
            ...network,
            networkMode: data.data,
          });
        }

        //:
      }
    };
    websocket.onclose = () => console.log(`WebSocket closed for ${deviceId}`);

    return () => websocket.close();
  }, [deviceId]);

  const sendCommand = (command: string, params?: any) => {
    console.log(command, ws, ws.readyState);
    if (command === "stopMonitoring") {
      setLogging(false);
    }
    if (command === "startMonitoring") {
      setLogging(true);
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ command, deviceId, params }));
    }
  };

  return { temperature, isPortOpen, type, sendCommand, logging, network };
};

export default useWebSocket;
