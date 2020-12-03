import { Player } from "@leancloud/play";
import { fromServerOnly, ReduxEventHandlers } from "@leancloud/stateful-game";
import { ActionType, StateType } from "@leancloud/stateful-game/action";
import mapValues = require("lodash/mapValues");
import { beats, UNKNOWN_CHOICE, ValidChoice } from "../../models";
import * as actions from "./actions";
import reducer from "./reducer";

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

export {
  reducer,
  actions,
};
export type RPSGameState = StateType<typeof reducer>;
export type RPSGameAction = ActionType<typeof actions>;

interface IValidChoiceMaop { [playerId: string]: ValidChoice; }

export const events: ReduxEventHandlers<RPSGameState, Event, IEventPayloads, RPSGameAction> = {
  [Event.PLAY]: (
    { dispatch, getState, emitEvent },
    { index, emitter, players },
  ) => {
    const { started, choices, result } = getState();
    if (!started) { return; }
    if (result) { return; }
    if (emitter !== undefined) {
      // 如果该玩家已经做出选择，什么都不做
      if (choices[emitter.userId] !== null) { return; }
      // 更新该玩家的选择
      dispatch(actions.setChoice(index, emitter));
    }
    // State is immutable. we must get a new one.
    const { choices: newChoices } = getState();
    const choiceList = Object.values(newChoices);
    // 如果有人还未选择，继续等待
    if (choiceList.indexOf(null) !== -1) { return; }
    // 这里的逻辑可能同时在服务端或客户端运行，因此会需要考虑客户端看到的状态是 UNKNOWN_CHOICE 的情况。
    if (choiceList.indexOf(UNKNOWN_CHOICE) !== -1) { return; }
    // 计算出赢家并更新到结果中
    dispatch(actions.setWinner(getWinner(newChoices as IValidChoiceMaop)));
  },
  [Event.GAME_START]: fromServerOnly((
    { dispatch },
    { players },
  ) => {
    dispatch(actions.start(players));
  }),
  [Event.PLAYER_LEFT]: fromServerOnly((
    { dispatch, getState, emitEvent },
    { players },
  ) => {
    if (getState().result) { return; }
    // 判定留下的唯一玩家为赢家
    dispatch(actions.setWinner(players[0].userId));
  }),
};

const getWinner = (choices: IValidChoiceMaop) => {
  const [[player1Id, player1Choice], [player2Id, player2Choice]] = Object.entries(choices);
  if (player1Choice === player2Choice) { return null; }
  return player1Choice === beats[player2Choice] ? player1Id : player2Id;
};

export const filter = (
  state: RPSGameState,
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
