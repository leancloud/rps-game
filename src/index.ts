import bodyParser = require("body-parser");
import cors = require("cors");
import d = require("debug");
import express = require("express");
import basicAuth = require("express-basic-auth");
import _ = require("lodash");
import { APP_ID, MASTER_KEY } from "./configs";
import Reception from "./reception";
import PRSGame from "./rps-game";

const app = express();
app.use(bodyParser());
app.use(cors());

// 首页仅起到响应健康检查的作用
app.get("/", (req, res) => {
  res.send(`
<p>这是 Play Server MasterClient 模式的服务端部分，客户端部分的示例代码在另一个项目中
    `);
});

const reception = new Reception(PRSGame);

const debug = d("MM");

// TODO: 这个接口需要鉴权与流控
app.post("/match", async (req, res, next) => {
  try {
    const playerId: string = req.body.playerId;
    if (typeof playerId !== "string") {
      throw new Error("Missing playerId");
    }
    debug(`Match player[${playerId}]`);
    const room = await reception.makeReservation(playerId);
    debug(`Seat reserved, room: ${room.name}`);
    return res.json({
      roomName: room.name,
    });
  } catch (error) {
    next(error);
  }
});

// app.post("/game", cors(), async (req, res, next) => {

// });

app.use("/admin", basicAuth({
  challenge: true,
  realm: APP_ID,
  users: { admin: MASTER_KEY },
}));

app.get("/admin/status", (req, res) => {
  res.json(reception.getStatus());
});

app.listen(process.env.LEANCLOUD_APP_PORT || 3000);
