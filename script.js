const SERVER = "wss://your-server.onrender.com"; // change to your deployed WS URL
let ws, player;

document.getElementById("connect").onclick = () => {
  const room = document.getElementById("room").value;
  const name = document.getElementById("name").value;
  ws = new WebSocket(SERVER);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "join", room, name }));
    document.getElementById("status").innerText = "Connected to " + room;
  };

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.type === "now_playing") {
      document.getElementById("trackTitle").innerText = msg.title || msg.videoId;
      if (!player) createPlayer(msg.videoId);
      else player.loadVideoById(msg.videoId);
    }
  };

  ws.onclose = () => {
    document.getElementById("status").innerText = "Disconnected";
  };
};

function createPlayer(videoId) {
  player = new YT.Player("player", {
    height: "315",
    width: "560",
    videoId,
    playerVars: { autoplay: 1, controls: 1 },
  });
}
