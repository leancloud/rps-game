import { Player } from "@leancloud/play";
import { ActionReducers, EventReducers } from "./stateful-game/core";

// [✊, ✌️, ✋] wins [✌️, ✋, ✊]
const wins = [1, 2, 0];

export const UNKNOWN_CHOICE = -1;

const getWinner = ([player1Choice, player2Choice]: number[], players: Player[])  => {
  if (player1Choice === player2Choice) {
    return { draw: true };
  }
  return {
    winnerId: (wins[player1Choice] === player2Choice
      ? players[0]
      : players[1]
    ).userId,
  };
};

export interface IRPSGameStates {
  started: boolean;
  choices: Array<number|null>;
  result: null | { winnerId?: string , draw?: boolean};
}

export enum Action {
  PLAY,
}
declare interface IActionPayloads {
  [Action.PLAY]: { index: number };
}

export enum Event {
  GAME_START,
  PLAYER_LEFT,
}
declare interface IEventPayloads {
  [Event.GAME_START]: void;
  [Event.PLAYER_LEFT]: void;
}

export const initialStates: IRPSGameStates = {
  choices: [null, null],
  result: null,
  started: false,
};

export const actions: ActionReducers<IRPSGameStates, Action, IActionPayloads, Event, IEventPayloads> = {
  [Action.PLAY](
    states,
    { actionSenderIndex, players, dispatchEvent },
    { index },
  ) {
    const { started, choices, result } = states;
    if (!started) { return; }
    if (result) { return; }
    // 如果该玩家已经做出选择，什么都不做
    if (choices[actionSenderIndex]) { return; }
    // 更新该玩家的选择
    choices[actionSenderIndex] = index;
    // 如果有人还未选择，继续等待
    if (choices.indexOf(null) !== -1) { return; }
    // 这里的逻辑可能同时在服务端或客户端运行，因此会需要考虑客户端看到的状态是 UNKNOWN_CHOICE 的情况。
    if (choices.indexOf(UNKNOWN_CHOICE) !== -1) { return; }
    // 计算出赢家并更新到结果中
    states.result = getWinner(choices as number[], players);
  },
};

export const events: EventReducers<IRPSGameStates, Event, IEventPayloads> = {
  [Event.GAME_START](
    states,
  ) {
    states.started = true;
  },
  [Event.PLAYER_LEFT](
    states,
    { game, players, dispatchEvent },
  ) {
    if (states.result) { return; }
    // 判定留下的唯一玩家为赢家
    states.result = {
      winnerId: game.players[0].userId,
    };
  },
};

export const filter = (
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
