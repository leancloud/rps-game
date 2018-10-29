import { GameManager, RedisLoadBalancer } from "@leancloud/client-engine";
import bodyParser = require("body-parser");
import cors = require("cors");
import d = require("debug");
import express = require("express");
import basicAuth = require("express-basic-auth");
import { APP_ID, APP_KEY, MASTER_KEY } from "./configs";
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

const gameManager = new GameManager(
  PRSGame,
  APP_ID,
  APP_KEY,
  {
    concurrency: 2,
  },
);

const redisLB = new RedisLoadBalancer(
  gameManager,
  process.env.REDIS_URL_CLIENT_ENGINE_SAMPLE_LB,
  {
    poolId: APP_ID.slice(0, 5),
  },
);
redisLB.on("online", () => console.log("LB redis connected")).on("offline", () => {
  console.warn(
`Can not connect to Redis server. Client Engine will keep running in the offline mode.
It's probably fine if you are running it locally without a Redis server. Otherwise, check project configs.`,
  );
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
    const roomName = await redisLB.consume(playerId);
    debug(`Seat reserved, room: ${roomName}`);
    return res.json({
      roomName,
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
  res.json({
    gameManager: gameManager.getStatus(),
    redisLB: redisLB.getStatus(),
  });
});

app.listen(process.env.LEANCLOUD_APP_PORT || 3000);

// Graceful shutdown
process.on("SIGTERM", async () => {
  debug("SIGTERM recieved. Closing the LB.");
  try {
    await redisLB.close();
    debug("Shutting down.");
    setTimeout(() => {
      process.exit(0);
    }, 100);
  } catch (error) {
    // 如果发生了异常，什么都不做，Client Engine 在超时后会 SIGKILL 掉进程
    console.error("Closing LB failed:");
    console.error(error);
  }
});
