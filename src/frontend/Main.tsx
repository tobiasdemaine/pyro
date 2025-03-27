import { useEffect, useState } from "react";
import { Config } from "./Config";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import useWebSocket from "./hooks/useWebSocket";
import { Network } from "./Network";

export interface Pyro {
  temperature: number | null;
  type: string;
  device: string;
  log: boolean;
}

export const Main = () => {
  const socket1 = useWebSocket("usb0");
  const socket2 = useWebSocket("usb0");
  const networkSocket = useWebSocket(null);

  const [pyro, setPyro] = useState<number>();
  const [pyro1, setPyro1] = useState<Pyro>({
    temperature: null,
    type: null,
    device: "usb0",
    log: false,
  });
  const [pyro2, setPyro2] = useState<Pyro>({
    temperature: null,
    type: null,
    device: "usb1",
    log: false,
  });
  const [config, setConfig] = useState(false);
  const [temp1, setTemp1] = useState<any[]>([]);
  const [temp2, setTemp2] = useState<any[]>([]);
  const [network, setNetwork] = useState(false);
  useEffect(() => {
    if (pyro1.log && socket1.temperature) {
      setTemp1([
        ...temp1,
        { temp: socket1.temperature, time: new Date().getTime() },
      ]);
    }
  }, [pyro1.log, socket1.temperature]);

  useEffect(() => {
    if (pyro2.log && socket2.temperature) {
      setTemp2([
        ...temp2,
        { temp: socket2.temperature, time: new Date().getTime() },
      ]);
    }
  }, [pyro2.log, socket2.temperature]);

  if (config) {
    return (
      <Config
        setPyro={pyro == 1 ? setPyro1 : setPyro2}
        device={pyro == 1 ? pyro1 : pyro2}
        setConfig={setConfig}
        socket={pyro == 1 ? socket1 : socket2}
      />
    );
  }

  if (network) {
    return <Network socket={networkSocket} setNetwork={setNetwork} />;
  }
  return (
    <>
      <div
        style={{ height: 320, width: 480, background: "#FFF", margin: "auto" }}
      >
        <div>
          <div
            style={socket1.isPortOpen ? styles.pyroButtonOn : styles.pyroButton}
            onClick={() => {
              setPyro(1);
              setConfig(true);
            }}
          >
            {socket1.isPortOpen && socket1.temperature && socket1.logging
              ? Number(socket1.temperature).toFixed(2)
              : "Connect 1"}
          </div>
          <div
            style={socket2.isPortOpen ? styles.pyroButtonOn : styles.pyroButton}
            onClick={() => {
              setPyro(2);
              setConfig(true);
            }}
          >
            {socket1.isPortOpen && socket2.temperature && socket2.logging
              ? Number(socket2.temperature).toFixed(2)
              : "Connect 2"}
          </div>
          <div
            style={{ ...styles.pyroButton, float: "right" }}
            onClick={() => {
              setNetwork(true);
            }}
          >
            Network Setup
          </div>
        </div>
        <div>
          <LineChart width={450} height={250}>
            <XAxis
              dataKey="time"
              type="number"
              domain={["auto", "auto"]}
              tickFormatter={(unixTimestamp) => {
                const date = new Date(unixTimestamp);
                return date.toLocaleTimeString();
              }}
            />
            <YAxis />
            <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
            <Line
              type="monotone"
              data={temp1}
              dataKey="temp"
              stroke="#8884d8"
              dot={false}
            />
            <Line
              type="monotone"
              data={temp2}
              dataKey="temp"
              stroke="#82ca9d"
              dot={false}
            />
          </LineChart>
        </div>
      </div>
    </>
  );
};

const styles: {
  pyroButton: React.CSSProperties;
  pyroButtonOn: React.CSSProperties;
} = {
  pyroButton: {
    borderRadius: 5,
    backgroundColor: "#AAA",
    color: "#fff",
    flex: 1,
    margin: 5,
    padding: 10,
    textAlign: "center",
    display: "inline-block",
  },
  pyroButtonOn: {
    borderRadius: 5,
    backgroundColor: "#04AA6D",
    color: "#fff",
    flex: 1,
    margin: 5,
    padding: 10,
    textAlign: "center",
    display: "inline-block",
  },
};
