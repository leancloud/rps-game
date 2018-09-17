// tslint:disable:max-classes-per-file
import { Event, Play, Player, Room } from "@leancloud/play";
import d = require("debug");
import { interval } from "rxjs";
import { filter, take } from "rxjs/operators";
import Game, { GameEvent } from "./game";

const debug = d("ClientEngine:Automation");

export const AutomaticGameEvent = {
  ROOM_FULL: Symbol("Room Full"),
};

/**
 * 在房间满员时自动派发 AutomaticGameEvent.ROOM_FULL 事件
 * @returns a Game decorator
 */
export function autoStart() {
  return <T extends { new (...args: any[]): Game }>(gameClass: T) => {
    return class extends gameClass {
      constructor(...params: any[]) {
        super(...params);
        this.watchPlayers();
      }

      private watchPlayers() {
        const playerJoinedHandler = ({ newPlayer }: { newPlayer: Player }) => {
          if (this.registeredPlayers.has(newPlayer.userId)) {
            this.registeredPlayers.delete(newPlayer.userId);
          }
          if (
            this.players.length ===
            (this.constructor as typeof AutomaticGame).playerLimit
          ) {
            debug(`Room [${this.room.name}] is full`);
            this.emit(AutomaticGameEvent.ROOM_FULL);
            unwatch();
          }
        };

        const unwatch = () =>
          this.masterClient.off(Event.PLAYER_ROOM_JOINED, playerJoinedHandler);

        this.masterClient.on(Event.PLAYER_ROOM_JOINED, playerJoinedHandler);
        this.once(GameEvent.END, unwatch);
      }
    };
  };
}

/**
 * 在所有玩家离开房间后自动销毁
 * @returns a Game decorator
 */
export function autoDestroy({ checkInterval = 10000 } = {}) {
  return <T extends { new (...args: any[]): Game }>(gameClass: T) => {
    return class AutoDestroyGame extends gameClass {
      private static killerTimer = interval(checkInterval);

      constructor(...params: any[]) {
        super(...params);
        AutoDestroyGame.killerTimer
          .pipe(
            filter(
              () => this.players.length + this.registeredPlayers.size === 0,
            ),
            take(2),
          )
          .toPromise()
          .then(() => {
            debug(`Room [${this.room.name}] is empty. Destroying.`);
            this.destroy();
          });
      }
    };
  };
}

/**
 * 当房间满员的时候自动开始，所有玩家离开后自动销毁的游戏。
 * 子类需要实现 start 方法。
 */
@autoDestroy()
@autoStart()
export class AutomaticGame extends Game {
  constructor(room: Room, masterClient: Play) {
    super(room, masterClient);
    this.once(AutomaticGameEvent.ROOM_FULL, () => this.start());
  }
  protected start() {
    throw new Error("Not implemented.");
  }
}
