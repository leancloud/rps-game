import { Player } from "@leancloud/play";
import { createAction } from "@leancloud/stateful-game/action";
import { ValidChoice } from "./models";

export const start = createAction(
  "START",
  (resolve) => (players: Player[]) => resolve(players),
);
export const setChoice = createAction(
  "SET_CHOICE",
  (resolve) => (choice: ValidChoice, player: Player) => resolve({ choice, player }),
);
export const setWinner = createAction(
  "SET_WINNER",
  (resolve) => (winnerId: string | null) => resolve(winnerId),
);
