import { Jwt } from "#auth";
import { isNullOrEmpty } from "#util";
import { JwtPayload } from "jsonwebtoken";
import { WebSocketServer } from "ws";
import { Server } from "https";

type BaseMessage = {
    type: string;
}

type UbfClient = { 
    clientId: string; 
    connection: any;
};

type CellState = {
  id: string;
};

type EdgeState = {
  id: string;
  keepGoing: boolean;
}

type GameState = {
  id: string;
  mapId: string;
  cells: Map<string, CellState>;
  edges: Map<string, EdgeState>;
}

// @kyle - Could we change the name to something like WebsocketServer?
export class UfbServer {
    public static shared: UfbServer ;
    private wss: WebSocketServer;
    private clients: UbfClient[] = [];

    constructor(server: Server) {
      this.createWss(server);
    }

    public static init(server: Server) {
      this.shared = new UfbServer (server);
    }

    private createWss(server: Server) {
      this.wss = new WebSocketServer({ server });
      this.wss.on('connection', async (conn, req) => {
        console.log("websocket connection initiating...");
        // token provided via query string
        let decodedToken: JwtPayload;
        try {
          const searchParams = new URLSearchParams(req.url.split("?")[1]);
          const token = searchParams.get("token");
          if (isNullOrEmpty(token)) throw new Error();
          decodedToken = Jwt.verify(token) as JwtPayload;
        } catch (err) {
          console.error(err);
          conn.close();
        }

        const clientId = decodedToken.sub;
        // const user = await Auth.getUserById(userId);
        // get client be clientId...

        console.info(`websocket connection accepted for client: ${clientId}`);
        conn.send(JSON.stringify({message: "hi..."}));
        this.serverSay(`user ${clientId} has connected.`);

        // user sent  message
        conn.on('message', (message) => {
          this.handleMessage(clientId, message.toString("utf-8"));
        });

        conn.on('close', (connection) => {
          console.log(`websocket connection closed for client: ${clientId}`)
          this.clients = this.clients.filter(entry => entry.clientId !== clientId);
        });

        this.clients.push({ clientId, connection: conn });
        console.log("connected clients: ", this.clients.length);

        // TODO: tell other clients about this new client
      });
    }

    private handleMessage(clientId: string, message: string) {
      try {
        console.log("message received: ", message);
        const client = this.clients.find(entry => entry.clientId === clientId);
        if (client === undefined) return;
        const parsedMessage = JSON.parse(message) as BaseMessage;
        if (parsedMessage.type === "hello") {
            client.connection.send(JSON.stringify({ type: "hello", message: "hello!" }));
        }
        else {
            client.connection.send(JSON.stringify({
              type: "error",
              message: "unknown message type"
            }));
        }
      } catch (err) {
        console.error(err);
      }
    }

    private broadcast(message: string) {
      for (const { connection } of this.clients) {
        connection.send(message);
      }
    }

    public serverSay(message: string) {
      this.broadcast(JSON.stringify({
        type: "say",
        message
      }));
    }
  }