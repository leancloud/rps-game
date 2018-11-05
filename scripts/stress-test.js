const { default: axios } = require('axios');
const { Play, Region, Event } = require("@leancloud/play");

const HOST = process.env.HOST || "http://localhost:3000";

const APP_ID = process.env.LEANCLOUD_APP_ID;
const APP_KEY = process.env.LEANCLOUD_APP_KEY;
const MASTER_KEY =  process.env.LEANCLOUD_APP_MASTER_KEY;

setInterval(() => {
  const play = new Play();
  play.init({
    appId: APP_ID,
    appKey: APP_KEY,
    region: Region.NorthChina,
  });
  play.userId = Date.now().toString();
  play.connect();
  play.on(Event.CONNECTED, async () => {
    const { data: { roomName } } = await axios.post(`${HOST}/reservation`, { playerId: play.userId });
    console.log(`${play.userId} join ${roomName}`);
    play.joinRoom(roomName);
  });
}, 1000);

