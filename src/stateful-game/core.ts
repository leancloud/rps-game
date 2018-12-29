import { Player } from "@leancloud/play";
import { createStore as originalCreateStore, Store } from "redux";

export enum Env {
  SERVER = 1,
  CLIENT = 2,
}

interface IEventContext {
  players: Player[];
  emitterIndex?: number;
  env: Env;
  emitterEnv: Env;
}

type Handler<StateOperator, Context, Payload> = (
  stateOperator: StateOperator,
  context: Context,
  payload: Payload,
) => any;

export type EventPayloads<Event extends string | number> = { [name in Event]?: any };

interface IStateOperator<State, E extends string | number, EP extends EventPayloads<E>> {
  getState: () => State;
  setState: (state: Partial<State>) => void;
  emitEvent: <N extends E>(name: N, payload?: EP[N], options?: {
    emitterIndex?: number,
  }) => any;
}

export type EventHandlers<
  State,
  Event extends string | number,
  Payloads extends EventPayloads<Event> = {},
> = {
  [name in Event]?: Handler<IStateOperator<State, Event, Payloads>, IEventContext, Payloads[name]>
};

interface IReduxStateOperator<State, E extends string | number, EP extends EventPayloads<E>> {
  getState: () => State;
  dispatch: Store["dispatch"];
  emitEvent: <N extends E>(name: N, payload?: EP[N], options?: {
    emitterIndex?: number,
  }) => any;
}

export type ReduxEventHandlers<
  State,
  Event extends string | number,
  Payloads extends EventPayloads<Event> = {},
> = {
  [name in Event]?: Handler<IReduxStateOperator<State, Event, Payloads>, IEventContext, Payloads[name]>
};

export function serverOnly<StateOperator, C extends { env: Env }, P>(
  handler: Handler<StateOperator, C, P>,
): Handler<StateOperator, C, P> {
  return (
    stateOperator: StateOperator,
    context: C,
    payload: P,
  ) => {
    if (context.env !== Env.SERVER) { return; }
    return handler(stateOperator, context, payload);
  };
}

export function fromServerOnly<StateOperator, C extends { emitterEnv: Env }, P>(
  handler: Handler<StateOperator, C, P>,
): Handler<StateOperator, C, P> {
  return (
    stateOperator: StateOperator,
    context: C,
    payload: P,
  ) => {
    if (context.emitterEnv !== Env.SERVER) { return; }
    return handler(stateOperator, context, payload);
  };
}
