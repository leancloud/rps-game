import { autoDestroy, AutomaticGameEvent, listen, watchRoomFull } from "@leancloud/client-engine";
import { Event as PlayEvent, Play, Player, Room } from "@leancloud/play";
import d = require("debug");
import { defineGame, GameActions, GameEvents } from "./stateful-game";

const debug = d("RPS");

// [✊, ✌️, ✋] wins [✌️, ✋, ✊]
const wins = [1, 2, 0];

const UNKNOWN_CHOICE = -1;

const getWinner = ([player1Choice, player2Choice]: number[], players: Player[])  => {
  if (player1Choice === player2Choice) {
    return { draw: true };
  }
  return {
    winnerId: (wins[player1Choice] === player2Choice
      ? players[0]
      : players[1]
    ).actorId,
  };
};

declare interface IRPSGameStates {
  started: boolean;
  choices: Array<number|null>;
  result: null | { winnerId?: string } | { draw?: boolean };
}

enum Action {
  PLAY,
}
declare interface IActionPayloads {
  [Action.PLAY]: { index: number };
}

enum Event {
  GAME_START,
  PLAYER_LEFT,
}
declare interface IEventPayloads {
  [Event.GAME_START]: void;
  [Event.PLAYER_LEFT]: void;
}

const initialStates: IRPSGameStates = {
  choices: [null, null],
  result: null,
  started: false,
};

const actions: GameActions<Action, IRPSGameStates, IActionPayloads> = {
  [Action.PLAY](
    states,
    { players, actionSenderIndex },
    { index },
  ) {
    const { started, choices } = states;
    if (!started) {
      return;
    }
    // 如果该玩家已经做出选择，什么都不做
    if (choices[actionSenderIndex]) {
      return;
    }
    // 更新该玩家的选择
    choices[actionSenderIndex] = index;
    // 如果有人还未选择，继续等待
    if (choices.indexOf(null) === -1) {
      return;
    }
    // 这里的逻辑可能同时在服务端或客户端运行，因此会需要考虑客户端看到的状态是 UNKNOWN_CHOICE 的情况。
    if (choices.indexOf(UNKNOWN_CHOICE) === -1) {
      return;
    }
    // 计算出赢家并更新到结果中
    states.result = getWinner(choices as number[], players);
  },
};

const events: GameEvents<Event, IRPSGameStates, IEventPayloads> = {
  [Event.GAME_START](
    states,
  ) {
    states.started = true;
  },
  [Event.PLAYER_LEFT](
    states,
    game,
  ) {
    // 判定留下的唯一玩家为赢家
    states.result = {
      winnerId: game.players[0].userId,
    };
  },
};

const filter = (
  states: IRPSGameStates,
  player: Player,
  playerIndex: number,
) => {
  if (states.result) {
    return states;
  }
  return {
    ...states,
    choices: states.choices.map((choice, index) => {
      if (index === playerIndex) {
        return choice;
      }
      if (choice === null) {
        return choice;
      }
      return UNKNOWN_CHOICE;
    }),
  };
};

/**
 * 石头剪刀布游戏
 */
@watchRoomFull()
@autoDestroy()
export default class RPSGame extends defineGame({
  actions,
  events,
  filter,
  initialStates,
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
    this.dispatchEvent(Event.GAME_START);
    // 监听 player 离开游戏事件
    listen(this.masterClient, PlayEvent.PLAYER_ROOM_LEFT).then(() => this.dispatchEvent(Event.PLAYER_LEFT));
  }
}
