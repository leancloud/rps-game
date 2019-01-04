import { autoDestroy, AutomaticGameEvent, listen, watchRoomFull } from "@leancloud/client-engine";
import { Event as PlayEvent, Play, Room } from "@leancloud/play";
import { defineReduxGame } from "@leancloud/stateful-game/server";
import d = require("debug");
import { Event as RPSGameEvent, events, filter, reducer } from "../rps-game-rules";

const debug = d("RPS");

/**
 * 石头剪刀布游戏
 */
@watchRoomFull()
@autoDestroy()
export default class RPSGame extends defineReduxGame({
  events,
  filter,
  reducer,
}) {
  public static defaultSeatCount = 2;

  constructor(room: Room, masterClient: Play) {
    super(room, masterClient);
    // 游戏创建后立刻执行的逻辑
    this.once(AutomaticGameEvent.ROOM_FULL, this.start);
  }

  public terminate() {
    // 将游戏 Room 的 open 属性标记为 false，不再允许用户加入了。
    // 客户端可以按照业务需求响应该属性的变化（例如对于还未开始的游戏，客户端可以重新发起加入新游戏请求）。
    this.masterClient.setRoomOpened(false);
    return super.terminate();
  }

  protected start = async () => {
    // 标记房间不再可加入
    this.masterClient.setRoomOpened(false);
    // 向客户端广播游戏开始事件
    this.emitEvent(RPSGameEvent.GAME_START);
    // 监听 player 离开游戏事件
    listen(this.masterClient, PlayEvent.PLAYER_ROOM_LEFT).then(() => this.emitEvent(RPSGameEvent.PLAYER_LEFT));
  }
}
