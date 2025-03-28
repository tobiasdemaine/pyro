import { useState } from "react";
import { Pyro } from "./Main";

export const Config = ({
  setPyro,
  device,
  setConfig,
  socket,
}: {
  setPyro: (pyro: Pyro) => void;
  device: Pyro;
  setConfig: (arg: boolean) => void;
  socket: {
    temperature: string;
    isPortOpen: boolean;
    type: string;
    sendCommand: (command: string, params?: any) => void;
    logging: boolean;
    network?: any;
  };
}) => {
  const [accuracy, setAccuracy] = useState<number | string>(0);
  const [type, setType] = useState<string>();
  return (
    <>
      <div
        style={{ height: 300, width: 430, background: "#FFF", margin: "auto" }}
      >
        <div
          onClick={() => {
            setConfig(false);
          }}
          style={{ ...styles.button, backgroundColor: "#777" }}
        >
          Exit
        </div>
        {!socket.isPortOpen ? (
          <div
            style={{ ...styles.button, float: "right" }}
            onClick={() => {
              socket.sendCommand("open");
            }}
          >
            Connect
          </div>
        ) : (
          <>
            <div
              style={{ ...styles.button, float: "right" }}
              onClick={() => {
                socket.sendCommand("close");
              }}
            >
              Disconnect
            </div>
            <div>
              {device.log ? (
                <>
                  <div
                    onClick={() => {
                      socket.sendCommand("stopMonitoring");
                      setPyro({ ...device, log: false });
                    }}
                    style={styles.button}
                  >
                    Stop Logging
                  </div>
                </>
              ) : (
                <>
                  {/*  <div>
                  <input
                    type="number"
                    value={accuracy}
                    onChange={(event) => {
                      setAccuracy(event.currentTarget.value);
                    }}
                  />
                  <div
                    style={styles.button}
                    onClick={() => {
                      socket.sendCommand("setTemperatureAccuracy", {
                        accuracy,
                      });
                    }}
                  ></div>
                </div> */}
                  <div
                    style={{
                      alignContent: "center",
                      textAlign: "center",
                      marginTop: 40,
                    }}
                  >
                    Set Type{" "}
                    <select
                      style={{ padding: 10, borderRadius: 5 }}
                      onChange={(event) => {
                        setPyro({ ...device, type: event.currentTarget.value });
                        setType(event.currentTarget.value);
                      }}
                      value={device.type}
                    >
                      <option value="K">K Type</option>
                      <option value="S">S Type</option>
                      <option value="N">N Type</option>
                    </select>
                    <div
                      onClick={() => {
                        if (type === "K") {
                          socket.sendCommand("writeTypeK");
                        }
                        if (type === "S") {
                          socket.sendCommand("writeTypeS");
                        }
                        if (type === "N") {
                          socket.sendCommand("writeTypeN");
                        }
                      }}
                      style={styles.button}
                    >
                      Set Type
                    </div>
                    <div
                      onClick={() => {
                        socket.sendCommand("startMonitoring");
                        setPyro({ ...device, log: true });
                        setConfig(false);
                        socket.temperature = null;
                      }}
                      style={{ ...styles.button, marginLeft: 50 }}
                    >
                      Start Logging
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

const styles: { button: React.CSSProperties } = {
  button: {
    borderRadius: 10,
    backgroundColor: "#04AA6D",
    color: "white",
    padding: 10,
    textAlign: "center",
    textDecoration: "none",
    fontSize: 16,
    margin: 5,
    display: "inline-block",
  },
};
