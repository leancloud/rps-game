import { Player } from "@leancloud/play";
import { EventHandlers, fromServerOnly } from "@leancloud/stateful-game";
import mapValues = require("lodash/mapValues");
import { beats, Choice, Result, UNKNOWN_CHOICE, ValidChoice } from "../models";

export interface IRPSGameState {
  started: boolean;
  choices: { [playerId: string]: Choice; };
  result: Result | null;
}

export enum Event {
  PLAY,
  GAME_START,
  PLAYER_LEFT,
}
declare interface IEventPayloads {
  [Event.PLAY]: { index: ValidChoice };
  [Event.GAME_START]: void;
  [Event.PLAYER_LEFT]: void;
}

export const initialState: IRPSGameState = {
  choices: {},
  result: null,
  started: false,
};

interface IValidChoiceMap { [playerId: string]: ValidChoice; }

export const events: EventHandlers<IRPSGameState, Event, IEventPayloads> = {
  [Event.PLAY]: (
    { getState, setState },
    { index, emitter, players },
  ) => {
    const { started, choices, result } = getState();
    if (!started) { return; }
    if (result) { return; }
    if (emitter !== undefined) {
      // 如果该玩家已经做出选择，什么都不做
      if (choices[emitter.userId]) { return; }
      // 更新该玩家的选择
      choices[emitter.userId] = index;
      setState({ choices });
    }
    const choiceList = Object.values(choices);
    // 如果有人还未选择，继续等待
    if (choiceList.indexOf(null) !== -1) { return; }
    // 这里的逻辑可能同时在服务端或客户端运行，因此会需要考虑客户端看到的状态是 UNKNOWN_CHOICE 的情况。
    if (choiceList.indexOf(UNKNOWN_CHOICE) !== -1) { return; }
    // 计算出赢家并更新到结果中
    setState({ result: getResult(getWinner(choices as IValidChoiceMap)) });
  },
  [Event.GAME_START]: fromServerOnly((
    { setState },
    { players },
  ) => setState({
    choices: players.reduce((prev, player) => ({
      ...prev,
      [player.userId]: null,
    }), {}),
    started: true,
  })),
  [Event.PLAYER_LEFT]: fromServerOnly((
    { getState, setState },
    { players },
  ) => {
    if (getState().result) { return; }
    // 判定留下的唯一玩家为赢家
    setState({ result: getResult(players[0].userId) });
  }),
};

const getWinner = (choices: IValidChoiceMap) => {
  const [[player1Id, player1Choice], [player2Id, player2Choice]] = Object.entries(choices);
  if (player1Choice === player2Choice) { return null; }
  return player1Choice === beats[player2Choice] ? player1Id : player2Id;
};

const getResult = (winnerId: string | null) => winnerId ? { winnerId } : { draw: true };

export const filter = (
  state: IRPSGameState,
  player: Player,
) => {
  if (state.result) {
    return state;
  }
  return {
    ...state,
    choices: mapValues(state.choices, (choice, playerId) => {
      if (playerId === player.userId) {
        return choice;
      }
      if (choice === null) {
        return choice;
      }
      return UNKNOWN_CHOICE;
    }),
  };
};
