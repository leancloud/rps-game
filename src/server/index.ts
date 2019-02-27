import {
  Game,
  GameManager,
  ICreateGameOptions,
  LoadBalancerFactory,
} from "@leancloud/client-engine";
import { Region } from "@leancloud/play";
import bodyParser = require("body-parser");
import cors = require("cors");
import d = require("debug");
import express = require("express");
import basicAuth = require("express-basic-auth");
import _ = require("lodash");
import os = require("os");
import PRSGameRedux from "../games/rps-game-redux/server";
import PRSGameVanilla from "../games/rps-game-vanilla/server";
import PRSGameXstate from "../games/rps-game-xstate/server";
import { GameMode } from "../games/types";
import { APP_ID, APP_KEY, MASTER_KEY } from "./configs";
import Reception from "./reception";

const apiRouter = express.Router();

apiRouter.use(bodyParser.json());
apiRouter.use(cors());

const loadBalancerFactory = new LoadBalancerFactory({
  poolId: `${APP_ID.slice(0, 5)}-${process.env.LEANCLOUD_APP_ENV ||
    "development"}`,
  redisUrl: process.env.REDIS_URL__CLIENT_ENGINE,
});

type GameConstructor<T extends Game> = GameManager<T>["gameClass"];

const createReception = <T extends Game>(game: GameConstructor<T>, name: string) => {
  const reception = new Reception(game, APP_ID, APP_KEY, {
    concurrency: 2,
    region: Region.EastChina,
  });

  const loadBalancer = loadBalancerFactory
    .bind(reception, ["makeReservation", "createGameAndGetName"], {
      poolId: name,
    })
    .on("online", () => console.log("Load balancer online"))
    .on("offline", () => {
      console.warn(
        `The load balancer can not connect to Redis server. Client Engine will keep running in standalone mode.
  It's probably fine if you are running it locally without a Redis server. Otherwise, check project configs.`,
      );
    });

  return {
    loadBalancer,
    reception,
  };
};

const games = {
  [GameMode.Vanilla]: createReception(PRSGameVanilla, GameMode.Vanilla),
  [GameMode.Redux]: createReception(PRSGameRedux, GameMode.Redux),
  [GameMode.Xstate]: createReception(PRSGameXstate, GameMode.Xstate),
};

const debug = d("ClientEngine");

// TODO: 这个接口需要鉴权与流控
apiRouter.post("/reservation", async (req, res, next) => {
  try {
    const { mode, playerId } = req.body as {
      mode: GameMode;
      playerId: any;
    };
    if (typeof playerId !== "string") {
      throw new Error("Missing playerId");
    }
    debug(`Making reservation for player[${playerId}]`);
    const roomName = await games[mode].reception.makeReservation(playerId);
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
    const { mode, playerId, options } = req.body as {
      mode: GameMode,
      playerId: any;
      options: ICreateGameOptions;
    };
    if (typeof playerId !== "string") {
      throw new Error("Missing playerId");
    }
    debug(`Creating a new game for player[${playerId}]`);
    const roomName = await games[mode].reception.createGameAndGetName(playerId, options);
    debug(`Game created, room: ${roomName}`);
    return res.json({
      roomName,
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.use(
  "/admin",
  basicAuth({
    challenge: true,
    realm: APP_ID,
    users: { admin: MASTER_KEY },
  }),
);

apiRouter.get("/admin/status", async (req, res, next) => {
  try {
    res.json({
      games: await Promise.all(_.map(games, async (game) => ({
        loadBalancer: await game.loadBalancer.getStatus(),
        reception: await game.reception.getStatus(),
      }))),
      memoryUsage: process.memoryUsage(),
      osLoadavg: os.loadavg(),
    });
  } catch (error) {
    next(error);
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  debug("SIGTERM recieved. Closing the LB.");
  try {
    await Promise.all(_.map(games, (game) => game.loadBalancer.close()));
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
