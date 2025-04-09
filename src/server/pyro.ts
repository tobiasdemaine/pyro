import { SerialPort } from "serialport";
import { EventEmitter } from "events";

class ThermocoupleDevice extends EventEmitter {
  private port: SerialPort;
  private isMonitoring = false;
  private dataBuffer: Buffer = Buffer.alloc(0);
  temp = 0;
  private lastDataTime: number = Date.now();
  private readonly STALL_TIMEOUT = 10000; // 10 seconds timeout
  private monitorInterval: NodeJS.Timeout | null = null;

  constructor(portPath: string) {
    super();
    this.port = new SerialPort({
      path: portPath,
      baudRate: 1200,
      dataBits: 8,
      parity: "none",
      stopBits: 1,
      autoOpen: false,
    });

    this.setupListeners();
  }

  public override on(event: string, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }

  private setupListeners(): void {
    this.port.on("open", () => {
      console.log("Serial port opened");
      this.lastDataTime = Date.now();
    });

    this.port.on("data", (data: Buffer) => {
      this.lastDataTime = Date.now();
      this.dataBuffer = Buffer.concat([this.dataBuffer, data]);

      if (this.isMonitoring) {
        while (this.dataBuffer.length >= 8) {
          if (
            this.dataBuffer[0] === 0xaa &&
            this.dataBuffer.length >= 8 &&
            this.dataBuffer[7] === 0xaa
          ) {
            const packet = this.dataBuffer.slice(0, 8);
            this.parseTemperature(packet);
            this.dataBuffer = this.dataBuffer.slice(8);
          } else {
            const nextStart = this.dataBuffer.indexOf(0xaa, 1);
            if (nextStart !== -1) {
              this.dataBuffer = this.dataBuffer.slice(nextStart);
            } else {
              this.dataBuffer = Buffer.alloc(0);
              break;
            }
          }
        }
      }
    });

    this.port.on("error", (err: Error) => {
      console.error("Port error:", err.message);
      this.handleStall();
    });

    this.port.on("close", () => {
      console.log("Port closed");
      this.isMonitoring = false;
    });
  }

  public async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.port.open((err) => {
        if (err) {
          reject(new Error(`Failed to open port: ${err.message}`));
        } else {
          console.log("Port is open:", this.port.isOpen);
          resolve();
        }
      });
    });
  }

  private async writeCommand(command: number[]): Promise<void> {
    const buffer = Buffer.from([0xaa, ...command, 0xaa]);
    console.log("Sending:", buffer.toString("hex"));
    this.dataBuffer = Buffer.alloc(0);
    return new Promise((resolve, reject) => {
      this.port.write(buffer, (err) => {
        if (err) {
          reject(new Error(`Write error: ${err.message}`));
        } else {
          this.port.drain((err) => {
            if (err) {
              reject(new Error(`Drain error: ${err.message}`));
            } else {
              console.log("Command sent successfully");
              resolve();
            }
          });
        }
      });
    });
  }

  private async waitForResponse(
    expectedLength: number,
    timeoutMs = 5000
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkData = () => {
        if (
          this.dataBuffer.length >= expectedLength &&
          this.dataBuffer[0] === 0xaa &&
          this.dataBuffer[expectedLength - 1] === 0xaa
        ) {
          const response = this.dataBuffer.slice(0, expectedLength);
          this.dataBuffer = this.dataBuffer.slice(expectedLength);
          console.log("Full response received:", response.toString("hex"));
          resolve(response);
        } else if (Date.now() - startTime > timeoutMs) {
          console.warn(
            `Timeout after ${timeoutMs}ms, but partial data: ${this.dataBuffer.toString(
              "hex"
            )}`
          );
          if (
            this.dataBuffer.length >= expectedLength &&
            this.dataBuffer[0] === 0xaa
          ) {
            const response = this.dataBuffer.slice(0, expectedLength);
            this.dataBuffer = this.dataBuffer.slice(expectedLength);
            resolve(response);
          } else {
            reject(
              new Error(
                `Timeout after ${timeoutMs}ms. Received: ${this.dataBuffer.toString(
                  "hex"
                )}`
              )
            );
          }
        } else {
          setTimeout(checkData, 50);
        }
      };
      checkData();
    });
  }

  public async readThermocoupleType(): Promise<string> {
    await this.writeCommand([0x04, 0x08]);
    const response = await this.waitForResponse(9);
    if (response.length === 9 && response[0] === 0xaa && response[8] === 0xaa) {
      const typeCode = response[3];
      switch (typeCode) {
        case 0x00:
          return "Type K";
        case 0x02:
          return "Type S";
        case 0x07:
          return "Type N";
        default:
          return `Unknown type code: ${typeCode}`;
      }
    }
    throw new Error(`Invalid response format: ${response.toString("hex")}`);
  }

  public async writeThermocoupleType(type: number): Promise<void> {
    await this.writeCommand([0x09, 0x01, type, 0x00, 0x00, 0x00, 0x00]);
    const response = await this.waitForResponse(9);
    console.log("Write response:", response.toString("hex"));
  }

  public async writeTypeK(): Promise<void> {
    console.log("Writing Type K...");
    await this.writeThermocoupleType(0x00);
    console.log("Type K set");
  }

  public async writeTypeS(): Promise<void> {
    console.log("Writing Type S...");
    await this.writeThermocoupleType(0x02);
    console.log("Type S set");
  }

  public async writeTypeN(): Promise<void> {
    console.log("Writing Type N...");
    await this.writeThermocoupleType(0x07);
    console.log("Type N set");
  }

  public async setTemperatureAccuracy(accuracy: number): Promise<void> {
    await this.writeCommand([0x06, 0x0c, accuracy, 0x00]);
    const response = await this.waitForResponse(6);
    console.log("Accuracy response:", response.toString("hex"));
  }

  public async startMonitoring(): Promise<void> {
    try {
      this.isMonitoring = true;
      await this.writeCommand([0x04, 0x0d]);
      console.log("Monitoring started successfully");

      if (this.monitorInterval) {
        clearInterval(this.monitorInterval);
      }
      this.lastDataTime = Date.now();
      this.monitorInterval = setInterval(() => {
        if (
          this.isMonitoring &&
          Date.now() - this.lastDataTime > this.STALL_TIMEOUT
        ) {
          this.handleStall();
        }
      }, 1000);
    } catch (err) {
      console.error("Error starting monitoring:", err);
      this.isMonitoring = false;
      throw err;
    }
  }

  private decodeTemperatureFromBuffer(buffer: Uint8Array | number[]): number {
    if (buffer.length < 7) {
      throw new Error("Buffer too short; expected at least 7 bytes");
    }
    const temp1 = buffer[6];
    const temp2 = buffer[5];
    const temp3 = buffer[4];
    const floatBuffer = new ArrayBuffer(4);
    const uint8View = new Uint8Array(floatBuffer);
    const float32View = new Float32Array(floatBuffer);
    uint8View[0] = 0x00;
    uint8View[1] = temp3;
    uint8View[2] = temp2;
    uint8View[3] = temp1;
    return float32View[0];
  }

  private async parseTemperature(data: Buffer): Promise<void> {
    if (
      data.length === 8 &&
      data[0] === 0xaa &&
      data[7] === 0xaa &&
      data[2] === 0x0d
    ) {
      const tempCelsius = this.decodeTemperatureFromBuffer(data);
      console.log(data, tempCelsius);

      this.emit("temperature", tempCelsius);
      this.temp = tempCelsius;

      if (this.isMonitoring) {
        await this.writeCommand([0x04, 0x0d]).catch((err) => {
          console.error("Error requesting next temperature:", err);
          this.isMonitoring = false;
        });
      }
    }
  }

  private async handleStall(): Promise<void> {
    console.log("Connection stalled, attempting to restart...");
    this.isMonitoring = false;

    try {
      if (this.port.isOpen) {
        await this.close();
      }

      await this.open();
      await this.startMonitoring();
      console.log("Monitoring restarted successfully");
    } catch (err) {
      console.error("Failed to restart monitoring:", err);
      setTimeout(() => this.handleStall(), 2000);
    }
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    console.log("Stopping monitoring...");
    this.port.close();
  }

  public async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.port.isOpen) {
        this.port.close(() => {
          console.log("Port closed in close()");
          resolve();
        });
      } else {
        console.log("Port already closed");
        resolve();
      }
    });
  }
}

export { ThermocoupleDevice };
