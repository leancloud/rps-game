import { Player } from "@leancloud/play";
import { createAction } from "typesafe-actions";
import { ValidChoice } from "./models";

export const start = createAction("START");
export const setChoice = createAction(
  "SET_CHOICE",
  (resolve) => (choice: ValidChoice, index: number) => resolve({ choice, index }),
);
export const setWinner = createAction(
  "SET_WINNER",
  (resolve) => (winner: Player | null) => resolve(winner),
);
