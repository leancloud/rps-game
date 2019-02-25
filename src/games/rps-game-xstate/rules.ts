// tslint:disable:object-literal-sort-keys
import { Env } from "@leancloud/stateful-game";
import { Choice, Result, UNKNOWN_CHOICE, ValidChoice } from "../models";

import { Player } from "@leancloud/play";

import { GameEventType } from "@leancloud/stateful-game";
import { assign, EventObject, Machine } from "@leancloud/stateful-game/xstate";
import { mapValues, pick } from "lodash";

export enum Event {
  PLAY = "PLAY",
  START = "START",
  PLAYER_LEAVE = "PLAYER_LEAVE",
}
export interface IEventPayloads {
  [Event.PLAY]: { index: ValidChoice };
  [Event.START]: void;
  [Event.PLAYER_LEAVE]: void;
}

export type PRSGameEvent = GameEventType<IEventPayloads>;

type Filter<TEvent, name> = TEvent extends { type: name }
  ? TEvent
  : never;

interface IPlayerSchema {
  states: {
    pending: {};
    settled: {};
  };
}
interface IPRSGameSchema {
  states: {
    waiting: {};
    started: {
      states: {
        player0: IPlayerSchema;
        player1: IPlayerSchema;
      };
    };
    end: {};
  };
}

interface IRPSGameContext {
  players: {
    player0?: string;
    player1?: string;
  };
  choices: { [playerId: string]: Choice };
  result?: Result;
}

const fromServer = (
  ctx: IRPSGameContext,
  // https://github.com/davidkpiano/xstate/issues/338
  event: PRSGameEvent | EventObject,
) => event.emitterEnv === Env.SERVER;

const from = (player: keyof IRPSGameContext["players"]) => (
  ctx: IRPSGameContext,
  // https://github.com/davidkpiano/xstate/issues/338
  event: PRSGameEvent | EventObject,
): boolean => !!event.emitter && event.emitter.userId === ctx.players[player];

const updateChoice = assign(
  (
    ctx: IRPSGameContext,
    event: Filter<PRSGameEvent, Event.PLAY> | EventObject,
  ) => {
    return {
      choices: {
        ...ctx.choices,
        [event.emitter!.userId]: event.payload.index,
      },
    };
  },
);

const initGame = assign(
  (_, event: Filter<PRSGameEvent, Event.START> | EventObject) => {
    const players = {
      player0: event.players[0].userId,
      player1: event.players[1].userId,
    };
    return {
      players,
      choices: Object.values(players).reduce(
        (result, playerId) =>
          Object.assign(result, {
            [playerId]: null,
          }),
        {},
      ),
    };
  },
);

// [✊, ✌️, ✋] wins [✌️, ✋, ✊]
const wins = [1, 2, 0];
interface IValidChoiceMaop {
  [playerId: string]: ValidChoice;
}
const getResult = (choices: IValidChoiceMaop) => {
  const [
    [player1Id, player1Choice],
    [player2Id, player2Choice],
  ] = Object.entries(choices);
  if (player1Choice === player2Choice) {
    return { draw: true };
  }
  const winnerId =
    wins[player1Choice] === player2Choice ? player1Id : player2Id;
  return { winnerId };
};
const judge = assign((ctx: IRPSGameContext) => ({
  result: getResult(ctx.choices as IValidChoiceMaop),
}));

export const machine = Machine<IRPSGameContext, IPRSGameSchema, PRSGameEvent>({
  id: "RPSGame",
  initial: "waiting",
  context: {
    players: {},
    choices: {},
  },
  states: {
    waiting: {
      on: {
        [Event.START]: {
          target: "started",
          cond: fromServer,
          actions: initGame,
        },
      },
    },
    started: {
      type: "parallel",
      states: {
        player0: {
          initial: "pending",
          states: {
            pending: {
              on: {
                [Event.PLAY]: {
                  target: "settled",
                  cond: from("player0"),
                  actions: updateChoice,
                },
              },
            },
            settled: {
              type: "final",
            },
          },
        },
        player1: {
          initial: "pending",
          states: {
            pending: {
              on: {
                [Event.PLAY]: {
                  target: "settled",
                  cond: from("player1"),
                  actions: updateChoice,
                },
              },
            },
            settled: {
              type: "final",
            },
          },
        },
      },
      onDone: {
        target: "end",
        actions: judge,
      },
      on: {
        [Event.PLAYER_LEAVE]: {
          target: "end",
          cond: fromServer,
          actions: assign((_, event) => ({
            result: { winnerId: event.players[0].userId },
          })),
        },
      },
    },
    end: {
      type: "final",
    },
  },
});

export const initialState = pick(machine.initialState, ["value", "context"]);
export type RPSGameState = typeof initialState;

export const filter = (state: RPSGameState, player: Player) => {
  if (state.context.result) {
    return state;
  }
  return {
    ...state,
    context: {
      ...state.context,
      choices: mapValues(state.context.choices, (choice, playerId) => {
        if (playerId === player.userId) {
          return choice;
        }
        if (choice === null) {
          return choice;
        }
        return UNKNOWN_CHOICE;
      }),
    },
  };
};
