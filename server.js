import http from "http";
import { WebSocketServer } from "ws";
import fs from "fs";
import path from "path";
import url from "url";

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  let pathname = url.parse(req.url).pathname;
  if (pathname === "/") pathname = "/index.html";
  const filePath = path.join(process.cwd(), pathname);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("404 Not Found");
      return;
    }
    const ext = path.extname(filePath);
    const ctype =
      ext === ".html"
        ? "text/html"
        : ext === ".js"
        ? "application/javascript"
        : "text/plain";
    res.writeHead(200, { "Content-Type": ctype });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

const rooms = new Map(); // roomName -> Set(ws)

function joinRoom(room, ws) {
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room).add(ws);
  ws.room = room;
}
function leaveRoom(ws) {
  if (!ws.room) return;
  const s = rooms.get(ws.room);
  if (!s) return;
  s.delete(ws);
  if (s.size === 0) rooms.delete(ws.room);
  delete ws.room;
}

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (msg.type === "join") {
      joinRoom(msg.room, ws);
      ws.name = msg.name || "anon";
    } else if (msg.type === "now_playing" && ws.room) {
      const s = rooms.get(ws.room) || new Set();
      for (const peer of s) {
        if (peer !== ws)
          peer.send(
            JSON.stringify({
              type: "now_playing",
              from: ws.name,
              videoId: msg.videoId,
              title: msg.title,
            })
          );
      }
    }
  });

  ws.on("close", () => leaveRoom(ws));
});

server.listen(port, () =>
  console.log(`✅ Server running on port ${port}`)
);
