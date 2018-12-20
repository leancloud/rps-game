import { Game as ClientEngineGame } from "@leancloud/client-engine";
import { Player } from "@leancloud/play";

interface IGameContext<E extends string | number, EP extends EventPayloads<E>> {
  players: Player[];
  dispatchEvent: <N extends E>(name: N, payload?: EP[N]) => any;
}
interface IGameEventContext<
  E extends string | number,
  EP extends EventPayloads<E>
> extends IGameContext<E, EP> {
  game: ClientEngineGame;
}
export interface IGameActionContext<
  E extends string | number,
  EP extends EventPayloads<E>
> extends IGameContext<E, EP> {
  actionSenderIndex: number;
}
export type EventPayloads<E extends string | number> = { [name in E]?: any };
export type GameEvents<
  S,
  E extends string | number,
  EP extends EventPayloads<E>
> = {
  [name in E]?: (
    state: S,
    context: IGameEventContext<E, EP>,
    payload: EP[name],
  ) => any
};

enum Empty {}
export type GameActions<
  S,
  A extends string | number,
  AP extends ActionPayloads<A>,
  E extends string | number = Empty,
  EP extends EventPayloads<E> = {}
> = {
  [name in A]?: (
    state: S,
    context: IGameActionContext<E, EP>,
    payload: AP[name],
  ) => any
};
export type ActionPayloads<A extends string | number> = { [name in A]?: any };
