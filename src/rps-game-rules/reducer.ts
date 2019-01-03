import { combineReducers } from "redux";
import { ActionType, getType } from "typesafe-actions";
import * as game from "./actions";
import { Choice, Result } from "./models";

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
