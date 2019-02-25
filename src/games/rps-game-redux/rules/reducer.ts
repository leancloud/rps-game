import { ActionType, getType } from "@leancloud/stateful-game/action";
import { combineReducers } from "@leancloud/stateful-game/redux";
import { Choice, Result } from "../../models";
import * as game from "./actions";

type RPSGameAction = ActionType<typeof game>;

export default combineReducers({
  choices: (
    state: {
      [playerId: string]: Choice;
    } = {},
    action: RPSGameAction,
  ) => {
    switch (action.type) {
      case getType(game.start): {
        return action.payload.reduce((prev, player) => ({
          ...prev,
          [player.userId]: null,
        }), {});
      }
      case getType(game.setChoice): {
        const { choice, player } = action.payload;
        return {
          ...state,
          [player.userId]: choice,
        };
      }
      default:
        return state;
    }
  },
  result: (state: Result | null = null, action: RPSGameAction) => {
    switch (action.type) {
      case getType(game.setWinner):
        const winnerId = action.payload;
        return winnerId ? { winnerId } : { draw: true };
      default:
       return state;
    }
  },
  started: (state = false, action: RPSGameAction) => {
    switch (action.type) {
      case getType(game.start):
        return true;
      default:
        return state;
    }
  },
});
