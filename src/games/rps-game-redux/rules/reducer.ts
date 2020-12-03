import { ActionType, getType } from "@leancloud/stateful-game/action";
import { combineReducers } from "@leancloud/stateful-game/redux";
import { Choice, Result } from "../../models";
import * as game from "./actions";

interface RPSGameStates {
  choices: Record<string, Choice>;
  result: Result | null;
  started: boolean;
}

type RPSGameAction = ActionType<typeof game>;

export default combineReducers<RPSGameStates, RPSGameAction>({
  choices: (state = {}, action) => {
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
  result: (state = null, action) => {
    switch (action.type) {
      case getType(game.setWinner):
        const winnerId = action.payload;
        return winnerId ? { winnerId } : { draw: true };
      default:
        return state;
    }
  },
  started: (state = false, action) => {
    switch (action.type) {
      case getType(game.start):
        return true;
      default:
        return state;
    }
  },
});
