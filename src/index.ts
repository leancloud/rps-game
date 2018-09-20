import bodyParser = require("body-parser");
import cors = require("cors");
import d = require("debug");
import express = require("express");
import basicAuth = require("express-basic-auth");
import { APP_ID, MASTER_KEY } from "./configs";
import GameManager from "./game-manager";
import PRSGame from "./rps-game";

const app = express();
app.use(bodyParser.json());
app.use(cors());

// 首页仅起到响应健康检查的作用
app.get("/", (req, res) => {
  res.send(`
<p>这是 LeanCloud Client Engine 的服务端部分，客户端部分的示例代码在 https://github.com/leancloud/client-engine-demo-webapp
    `);
});

const gameManager = new GameManager(PRSGame, {
  concurrency: 2,
});

const debug = d("ClientEngine");

// TODO: 这个接口需要鉴权与流控
app.post("/reservation", async (req, res, next) => {
  try {
    const playerId: string = req.body.playerId;
    if (typeof playerId !== "string") {
      throw new Error("Missing playerId");
    }
    debug(`Making reservation for player[${playerId}]`);
    const room = await gameManager.makeReservation(playerId);
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
  res.json(gameManager.getStatus());
});

if (process.env.SERVE_DOCS === "1") {
  app.use("/docs", express.static("docs"));
}

app.listen(process.env.LEANCLOUD_APP_PORT || 3000);

// Graceful shutdown
process.on("SIGTERM", async () => {
  debug("SIGTERM recieved. Closing the gameManager.");
  try {
    await gameManager.close();
    debug("Shutting down.");
    setTimeout(() => {
      process.exit(0);
    }, 100);
  } catch (error) {
    // 如果发生了异常，什么都不做，Client Engine 在超时后会 SIGKILL 掉进程
    console.error("Closing gameManager failed:");
    console.error(error);
  }
});
