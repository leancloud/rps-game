import produce from "immer";
import { combineReducers } from "redux";
import { ActionType, getType } from "typesafe-actions";
import * as game from "./actions";
import { Choice, Result } from "./models";

type RPSGameAction = ActionType<typeof game>;

export default combineReducers({
  choices: (state: Choice[] = [null, null], action: RPSGameAction) => produce(state, (draft) => {
    switch (action.type) {
      case getType(game.setChoice):
        const { choice, index } = action.payload;
        draft[index] = choice;
      }
  }),
  result: (state: Result | null = null, action: RPSGameAction) => {
    switch (action.type) {
      case getType(game.setWinner):
        const winner = action.payload;
        return winner ? { winnerId: winner.userId } : { draw: true };
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
