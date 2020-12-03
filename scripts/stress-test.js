const { default: axios } = require("axios");
const { Client, ReceiverGroup } = require("@leancloud/play");

const HOST = process.env.HOST || "http://localhost:3000";

const APP_ID = process.env.LEANCLOUD_APP_ID;
const APP_KEY = process.env.LEANCLOUD_APP_KEY;
const API_SERVER = process.env.LEANCLOUD_API_SERVER;
const MASTER_KEY = process.env.LEANCLOUD_APP_MASTER_KEY;

if (!APP_ID)
  throw new Error(
    "process.env.LEANCLOUD_APP_ID not set, run `$(lean env)` to export."
  );

let playerCount = 50;
const sendEventInterval = 100;

setInterval(async () => {
  if (!playerCount) return;
  playerCount--;
  const client = new Client({
    appId: APP_ID,
    appKey: APP_KEY,
    playServer: API_SERVER,
    userId: Date.now().toString(),
  });
  await client.connect();
  const {
    data: { roomName },
  } = await axios.post(`${HOST}/reservation`, { playerId: client.userId });
  console.log(`${client.userId} join ${roomName}`);
  await client.joinRoom(roomName);
  setInterval(() => {
    try {
      client.sendEvent(
        0, // Event.Play
        { index: 1 },
        { receiverGroup: ReceiverGroup.All }
      );
    } catch (e) {}
  }, sendEventInterval);
}, 1000);

setInterval(async () => {
  const {
    data: {
      memoryUsage,
      osLoadavg,
      reception: { load },
    },
  } = await axios.get(`${HOST}/admin/status`, {
    auth: {
      username: "admin",
      password: MASTER_KEY,
    },
  });
  console.log(
    Date.now(),
    JSON.stringify({
      memoryUsage,
      osLoadavg,
      receptionLoad: load,
    })
  );
}, 1000);
