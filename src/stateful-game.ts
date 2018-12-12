import { Game } from "@leancloud/client-engine";
import { Play, Player, Room } from "@leancloud/play";
import produce from "immer";

interface IGameActionContext {
  players: Player[];
  actionSenderIndex: number;
}

type EventPayloads<E extends string | number> = { [name in E]?: any };
export type GameEvents<
  E extends string | number,
  S,
  P extends EventPayloads<E>
> = { [name in E]?: (state: S, game: Game, payload: P[name]) => any };

type ActionPayloads<A extends string | number> = { [name in A]?: any };
export type GameActions<
  A extends string | number,
  S,
  P extends ActionPayloads<A>
> = {
  [name in A]?: (state: S, ctx: IGameActionContext, payload: P[name]) => any
};

export const defineGame = <
  States extends { [key: string]: any },
  Action extends string | number,
  Event extends string | number,
  AP extends ActionPayloads<Action>,
  EP extends EventPayloads<Event>
>({
  initialStates,
  actions = {},
  events = {},
  filter = (states: States) => {
    return states;
  },
}: {
  initialStates: States;
  actions?: GameActions<Action, States, AP>;
  events?: GameEvents<Event, States, EP>;
  filter?: (states: States, player: Player, playerIndex: number) => States;
}) =>
  class StatefulGame extends Game {
    protected states = initialStates;
    protected actions = actions;
    protected events = events;
    protected filter = filter;

    constructor(room: Room, masterClient: Play) {
      super(room, masterClient);
      this.getStream("_action").subscribe(
        ({ eventData: { name, payload }, senderId }) =>
          this.dispatchAction(name, senderId, payload),
      );
    }

    protected broadcastStates() {
      console.log(this.states);
      this.players.map((player) =>
        this.masterClient.sendEvent(
          "_update",
          this.filter(this.states, player, player.actorId - 2),
          {
            targetActorIds: [player.actorId],
          },
        ),
      );
    }

    protected dispatchAction(
      name: Action,
      actionSenderIndex: number,
      payload?: any,
    ) {
      const handler = this.actions[name];
      if (handler) {
        this.states = produce(this.states, (draft) =>
          handler(
            draft as States,
            {
              actionSenderIndex,
              players: this.players,
            },
            payload,
          ),
        );
        this.broadcastStates();
      }
    }

    protected dispatchEvent<N extends Event>(name: N, payload?: EP[N]) {
      const handler = this.events[name];
      if (handler) {
        this.states = produce(this.states, (draft) =>
          handler(draft as States, this, payload),
        );
        this.broadcastStates();
      }
    }
  };
