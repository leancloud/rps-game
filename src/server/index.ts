import {
  ICreateGameOptions,
  LoadBalancerFactory,
} from "@leancloud/client-engine";
import { Region } from "@leancloud/play";
import bodyParser = require("body-parser");
import cors = require("cors");
import d = require("debug");
import express = require("express");
import basicAuth = require("express-basic-auth");
import os = require("os");
import { APP_ID, APP_KEY, MASTER_KEY } from "./configs";
import Reception from "./reception";
import PRSGame from "./rps-game";

const apiRouter = express.Router();

apiRouter.use(bodyParser.json());
apiRouter.use(cors());

const reception = new Reception(
  PRSGame,
  APP_ID,
  APP_KEY,
  {
    concurrency: 2,
    // 如果要使用其他节点，暂时需要手动指定，该参数会在今后移除。
    // 需要先 import { Region } from "@leancloud/play";
    region: Region.EastChina,
  },
);

const loadBalancerFactory = new LoadBalancerFactory({
  poolId: `${APP_ID.slice(0, 5)}-${process.env.LEANCLOUD_APP_ENV || "development"}`,
  redisUrl: process.env.REDIS_URL__CLIENT_ENGINE,
});

const loadBalancer = loadBalancerFactory
  .bind(reception, ["makeReservation", "createGameAndGetName"])
  .on("online", () => console.log("Load balancer online")).on("offline", () => {
    console.warn(
`The load balancer can not connect to Redis server. Client Engine will keep running in standalone mode.
It's probably fine if you are running it locally without a Redis server. Otherwise, check project configs.`,
    );
  });

const debug = d("ClientEngine");

// TODO: 这个接口需要鉴权与流控
apiRouter.post("/reservation", async (req, res, next) => {
  try {
    const {
      playerId,
    } = req.body as {
      playerId: any;
    };
    if (typeof playerId !== "string") {
      throw new Error("Missing playerId");
    }
    debug(`Making reservation for player[${playerId}]`);
    const roomName = await reception.makeReservation(playerId);
    debug(`Seat reserved, room: ${roomName}`);
    return res.json({
      roomName,
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/game", async (req, res, next) => {
  try {
    const {
      playerId,
      options,
    } = req.body as {
      playerId: any;
      options: ICreateGameOptions;
    };
    if (typeof playerId !== "string") {
      throw new Error("Missing playerId");
    }
    debug(`Creating a new game for player[${playerId}]`);
    const roomName = await reception.createGameAndGetName(playerId, options);
    debug(`Game created, room: ${roomName}`);
    return res.json({
      roomName,
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.use("/admin", basicAuth({
  challenge: true,
  realm: APP_ID,
  users: { admin: MASTER_KEY },
}));

apiRouter.get("/admin/status", async (req, res, next) => {
  try {
    res.json({
      loadBalancer: await loadBalancer.getStatus(),
      memoryUsage: process.memoryUsage(),
      osLoadavg: os.loadavg(),
      reception: await reception.getStatus(),
    });
  } catch (error) {
    next(error);
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  debug("SIGTERM recieved. Closing the LB.");
  try {
    await loadBalancer.close();
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

export default apiRouter;
