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

type Handler<Context, Payload> = (
  states: any,
  context: Context,
  payload: Payload,
) => any;

export type EventPayloads<Command extends string | number> = { [name in Command]?: any };
export type EventHandlers<
  Command extends string | number,
  Payloads extends EventPayloads<Command> = {},
> = {
  [name in Command]?: Handler<IEventContext<Command, Payloads>, Payloads[name]>
};

export function serverOnly<C extends { env: Env }, P>(handler: Handler<C, P>): Handler<C, P> {
  return (
    states: any,
    context: C,
    payload: P,
  ) => {
    if (context.env !== Env.SERVER) { return; }
    return handler(states, context, payload);
  };
}

export function fromServerOnly<C extends { emitterEnv: Env }, P>(handler: Handler<C, P>): Handler<C, P> {
  return (
    states: any,
    context: C,
    payload: P,
  ) => {
    if (context.emitterEnv !== Env.SERVER) { return; }
    return handler(states, context, payload);
  };
}
