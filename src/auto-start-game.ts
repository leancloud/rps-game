import { Event, Play, Player, Room} from "@leancloud/play";
import Game, { GameEvent } from "./game";

/**
 * 当房间满员的时候自动开始的游戏
 * 子类必须实现 start 方法
 */
export default abstract class AutoStartGame extends Game {
  constructor(room: Room, masterClient: Play) {
    super(room, masterClient);

    const playerJoinedHandler = ({ newPlayer }: {
      newPlayer: Player,
    }) => {
      if (this.registeredPlayers.has(newPlayer.userId)) {
        this.registeredPlayers.delete(newPlayer.userId);
      }
      if (this.availableSeatCount === 0) {
        this.start();
      }
    };

    masterClient.on(Event.PLAYER_ROOM_JOINED, playerJoinedHandler);
    this.once(GameEvent.END, () => masterClient.off(Event.PLAYER_ROOM_JOINED, playerJoinedHandler));
  }

  protected abstract start(): any;
}
