import { CreateRoomFlag, Event, Play, Region, Room } from "@leancloud/play";
import d = require("debug");
import { EventEmitter } from "events";
import _ = require("lodash");
import generate = require("nanoid/generate");
import { APP_ID, APP_KEY } from "./configs";
import Game, { GameEvent } from "./game";
import { listen, listenNodeEE } from "./utils";

const debug = d("MM:Reception");

const createNewMasterClient = () => {
  const masterClient = new Play();
  masterClient.init({
    appId: APP_ID,
    appKey: APP_KEY,
    region: Region.NorthChina,
  });
  const alphabet =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
  masterClient.userId = generate(alphabet, 10);
  return masterClient;
};

interface IGameConstructor<T extends Game> {
  playerLimit: number;
  new(room: Room, masterClient: Play, ...args: any[]): T;
}

/**
 * Reception 负责游戏房间的分配
 */
export default class Reception<T extends Game> {

  private waitingList: string[] = [];
  private availableGames: Game[] = [];
  private games = new Set<Game>();
  /**
   * 叫号器
   */
  private ee = new EventEmitter();

  private isMatching = false;

  constructor(private gameClass: IGameConstructor<T>) {}

  public getStatus() {
    return {
      availableGames: this.availableGames.map((game) => game.room.name),
      games: Array.from(this.games).map(({
        room: {
          name, master, playerList,
        },
        availableSeatCount,
        registeredPlayers,
        players,
      }) => ({
        availableSeatCount,
        master: master.userId,
        name,
        players: players.map((player) => player.userId),
        registeredPlayers: Array.from(registeredPlayers.values()),
      })),
      waitingList: this.waitingList,
    };
  }

  public makeReservation(playerId: string) {
    if (playerId in this.waitingList) {
      throw new Error("Already in queue");
    }
    this.waitingList.push(playerId);
    debug(`add [${playerId}] to waitingList %o`, this.waitingList);
    const result = listenNodeEE<Room>(this.ee, playerId, `${playerId}:error`);
    this.startMatch().catch(console.error);
    return result;
  }

  /**
   * 开始为玩家分配游戏房间
   */
  private async startMatch() {
    debug("match started");
    if (this.isMatching) { return; }
    this.isMatching = true;
    await this.match();
    this.isMatching = false;
    debug("match end");
  }

  private async match(): Promise<void> {
    if (this.waitingList.length === 0) { return; }
    if (this.availableGames.length === 0) {
      debug(`No room available, creating a new game`);
      console.log("before start", process.memoryUsage());
      const room = await this.createNewGame();
      this.addGame(room);
    }
    const playerId = this.waitingList.shift()!;
    try {
      // 目前只考虑单人匹配的情况，因此拿到第一个 availableGame 即可
      const availableGame = this.availableGames[0];
      this.reserveSeats(availableGame, playerId);
      debug(`match succeed with game %o`, availableGame.room.name);
      this.ee.emit(playerId, availableGame.room);
    } catch (error) {
      debug(`match error %o`, error);
      this.ee.emit(`${playerId}:error`, error);
    }
    // 继续 match，直到消费完 waitingList
    return this.match();
  }

  private addGame(game: Game) {
    this.games.add(game);
    this.availableGames.push(game);
  }

  private markGameAvailable(game: Game) {
    if (this.availableGames.indexOf(game) === -1) {
      this.availableGames.push(game);
    }
  }

  private reserveSeats(game: Game, playerId: string) {
    const { availableSeatCount } = game;
    if (availableSeatCount <= 0) {
      // 这种情况不应该出现，但是如果出现了我们默默的从可用列表中移除这个 Room
      this.removeFromAvailableGames(game);
      throw new Error(`Reserve seats fail: room[${game.room.name}] is full`);
    }
    // 预订成功
    game.registeredPlayers.add(playerId);
    // 订位超时未加入房间的话释放该位置
    setTimeout(() => {
      this.checkReservation(game, playerId);
    }, game.reservationHoldTime || 10000);
    if (game.availableSeatCount === 0) {
      this.removeFromAvailableGames(game);
    }
  }

  private checkReservation(game: Game, playerId: string) {
    if (game.registeredPlayers.has(playerId)) {
      debug(`Reservation[${playerId}] timeout, canceling.`);
      game.registeredPlayers.delete(playerId);
      if (game.availableSeatCount > 0) {
        this.markGameAvailable(game);
      }
    }
  }

  private removeFromAvailableGames(game: Game) {
    _.remove(this.availableGames, (g) => g === game);
  }

  private async createNewGame() {
    const masterClient = createNewMasterClient();
    masterClient.connect();
    await listen(masterClient, Event.CONNECTED, Event.CONNECT_FAILED);
    debug(`New master client online: ${masterClient.userId}`);
    masterClient.createRoom({
      roomOptions: {
        flag:
          // tslint:disable-next-line:no-bitwise
          CreateRoomFlag.FixedMaster |
          CreateRoomFlag.MasterUpdateRoomProperties,
        maxPlayerCount: this.gameClass.playerLimit + 1, // masterClient should be included
        visible: false,
      },
    });
    return listen(masterClient, Event.ROOM_CREATED, Event.ROOM_CREATE_FAILED).then(
      () => {
        const game = new this.gameClass(masterClient.room, masterClient);
        game.once(GameEvent.END, () => this.destroy(game));
        return game;
      },
    );
  }

  private destroy(game: T) {
    debug(`Game end. Destroy [${game.room.name}].`);
    this.games.delete(game);
    this.removeFromAvailableGames(game);
    game.masterClient.disconnect();
  }
}
