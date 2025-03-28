import { useEffect, useState } from "react";

export const Network = ({
  setNetwork,
  socket,
}: {
  setNetwork: (x: boolean) => void;
  socket: any;
}) => {
  const [accessPointOn, setAccessPointOn] = useState(true);
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.sendCommand("checkNetworkMode");
    socket.sendCommand("accessPointDetails");
    socket.sendCommand("networkStatus");
  }, []);

  const NetworkInfo = () => {
    return (
      <>
        <div style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Network Information</h3>
          {socket.network.networkDetails ??
            socket.network.networkDetails.map((interf: any, index: number) => (
              <div key={index}>
                {interf.interface} {interf.ip}
              </div>
            ))}

          {socket.network.apDetails && (
            <>
              <div>SSID : {socket.network.apDetails.ssid}</div>
              <div>PASS : {socket.network.apDetails.password}</div>
            </>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      <div
        style={{
          height: "100%",
          maxWidth: 480,
          maxHeight: 320,
          width: "vw",
          background: "#FFF",
          margin: "auto",
        }}
      >
        <div
          style={styles.button}
          onClick={() => {
            setNetwork(false);
          }}
        >
          Back
        </div>

        <div style={{ float: "right", padding: 15 }}>
          <label>
            Access Point{" "}
            <input
              type="checkbox"
              checked={accessPointOn}
              onChange={(e) => {
                setAccessPointOn(e.target.checked);
                if (e.target.checked) {
                  socket.sendCommand("accessPoint");
                } else {
                  socket.sendCommand("stopAP");
                }
              }}
            />
          </label>
        </div>
        {accessPointOn ? (
          <NetworkInfo />
        ) : (
          <div>
            {connected ? (
              <NetworkInfo />
            ) : (
              <>
                <div style={{ padding: 20, paddingBottom: 0 }}>
                  <input
                    type="text"
                    placeholder="SSID"
                    value={ssid}
                    onChange={(e) => {
                      setSsid(e.target.value);
                    }}
                    style={{ padding: 10, marginRight: 20 }}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                    }}
                    style={{ padding: 10 }}
                  />
                  <div
                    style={{ ...styles.button, marginLeft: 0 }}
                    onClick={() => {
                      setConnected(true);
                      socket.sendCommand("wifiConnect", { ssid, password });
                    }}
                  >
                    Connect
                  </div>
                </div>

                <NetworkInfo />
              </>
            )}
          </div>
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
