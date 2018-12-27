import { Player } from "@leancloud/play";

export enum Env {
  SERVER = 1,
  CLIENT = 2,
}

interface IEventContext<E extends string | number, EP extends EventPayloads<E>> {
  players: Player[];
  emitterIndex?: number;
  env: Env;
  emitterEnv: Env;
  emitEvent: <N extends E>(name: N, payload?: EP[N], options?: {
    emitterIndex?: number,
  }) => any;
}

interface IStateAccessor<State> {
  getState: () => State;
  setState: (state: Partial<State>) => void;
}

type Handler<State, Context, Payload> = (
  state: IStateAccessor<State>,
  context: Context,
  payload: Payload,
) => any;

export type EventPayloads<Command extends string | number> = { [name in Command]?: any };
export type EventHandlers<
  State,
  Command extends string | number,
  Payloads extends EventPayloads<Command> = {},
> = {
  [name in Command]?: Handler<State, IEventContext<Command, Payloads>, Payloads[name]>
};

export function serverOnly<S, C extends { env: Env }, P>(handler: Handler<S, C, P>): Handler<S, C, P> {
  return (
    state: IStateAccessor<S>,
    context: C,
    payload: P,
  ) => {
    if (context.env !== Env.SERVER) { return; }
    return handler(state, context, payload);
  };
}

export function fromServerOnly<S, C extends { emitterEnv: Env }, P>(handler: Handler<S, C, P>): Handler<S, C, P> {
  return (
    state: IStateAccessor<S>,
    context: C,
    payload: P,
  ) => {
    if (context.emitterEnv !== Env.SERVER) { return; }
    return handler(state, context, payload);
  };
}
