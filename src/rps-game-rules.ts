import { Player } from "@leancloud/play";
import { EventHandlers, fromServerOnly } from "./stateful-game/core";

// [✊, ✌️, ✋] wins [✌️, ✋, ✊]
const wins = [1, 2, 0];

export const UNKNOWN_CHOICE = -1;

export interface IRPSGameState {
  started: boolean;
  choices: Array<number|null>;
  result: null | { winnerId?: string , draw?: boolean};
}

export enum Event {
  PLAY,
  GAME_START,
  PLAYER_LEFT,
}
declare interface IEventPayloads {
  [Event.PLAY]: { index: number };
  [Event.GAME_START]: void;
  [Event.PLAYER_LEFT]: void;
}

export const initialState: IRPSGameState = {
  choices: [null, null],
  result: null,
  started: false,
};

export const events: EventHandlers<IRPSGameState, Event, IEventPayloads> = {
  [Event.PLAY]: (
    { getState, setState },
    { emitterIndex, players, emitEvent },
    { index },
  ) => {
    const { started, choices, result } = getState();
    if (!started) { return; }
    if (result) { return; }
    if (emitterIndex !== undefined) {
      // 如果该玩家已经做出选择，什么都不做
      if (choices[emitterIndex]) { return; }
      // 更新该玩家的选择
      choices[emitterIndex] = index;
      setState({ choices });
    }
    // 如果有人还未选择，继续等待
    if (choices.indexOf(null) !== -1) { return; }
    // 这里的逻辑可能同时在服务端或客户端运行，因此会需要考虑客户端看到的状态是 UNKNOWN_CHOICE 的情况。
    if (choices.indexOf(UNKNOWN_CHOICE) !== -1) { return; }
    // 计算出赢家并更新到结果中
    setState({ result: getResult(getWinner(choices as number[], players)) });
  },
  [Event.GAME_START]: fromServerOnly((
    { setState },
  ) => setState({ started: true })),
  [Event.PLAYER_LEFT]: fromServerOnly((
    { getState, setState },
    { players, emitEvent },
  ) => {
    if (getState().result) { return; }
    // 判定留下的唯一玩家为赢家
    setState({ result: getResult(players[0]) });
  }),
};

const getWinner = ([player1Choice, player2Choice]: number[], players: Player[]) => {
  if (player1Choice === player2Choice) { return null; }
  return wins[player1Choice] === player2Choice ? players[0] : players[1];
};

const getResult = (winner: Player | null) => winner ? { winnerId: winner.userId } : { draw: true };

export const filter = (
  state: IRPSGameState,
  player: Player,
  playerIndex: number,
) => {
  if (state.result) {
    return state;
  }
  return {
    ...state,
    choices: state.choices.map((choice, index) => {
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
