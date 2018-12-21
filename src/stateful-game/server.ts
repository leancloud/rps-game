import { Game } from "@leancloud/client-engine";
import { Play, Player, Room } from "@leancloud/play";
import d = require("debug");
import produce from "immer";
import { ActionPayloads, ActionReducers, EventPayloads, EventReducers } from "./core";

const debug = d("StatefulGame:Server");

export abstract class StatefulGame<
  States extends { [key: string]: any },
  Action extends string | number,
  AP extends ActionPayloads<Action>,
  Event extends string | number,
  EP extends EventPayloads<Event>,
> extends Game {
  protected abstract states: States;
  protected abstract actions: ActionReducers<States, Action, AP, Event, EP>;
  protected abstract events: EventReducers<States, Event, EP>;
  protected abstract filter: (
    states: States,
    player: Player,
    playerIndex: number,
  ) => States;

  constructor(room: Room, masterClient: Play) {
    super(room, masterClient);
    this.getStream("_action").subscribe(
      ({ eventData: { name, payload }, senderId }) =>
        this.dispatchAction(name, senderId - 2, payload),
    );
  }

  protected broadcastStates() {
    debug("states: %o", this.states);
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

  protected dispatchEvent = <N extends Event>(name: N, payload?: EP[N]) => {
    debug("event: %o", { name, payload });
    const handler = this.events[name];
    if (handler) {
      const context = {
        dispatchEvent: this.dispatchEvent,
        game: this,
        players: this.players,
      };

      this.states = produce(this.states, (draft) =>
        handler(draft as States, context, payload),
      );
      this.broadcastStates();
    }
  }

  private dispatchAction(
    name: Action,
    actionSenderIndex: number,
    payload?: any,
  ) {
    debug("action: %o", { name, actionSenderIndex, payload });
    const handler = this.actions[name];
    if (handler) {
      const context = {
        actionSenderIndex,
        dispatchEvent: this.dispatchEvent,
        players: this.players,
      };
      this.states = produce(this.states, (draft) =>
        handler(draft as States, context, payload),
      );
      this.broadcastStates();
    }
  }
}

export const defineGame = <
  States extends { [key: string]: any },
  Action extends string | number,
  AP extends ActionPayloads<Action>,
  Event extends string | number,
  EP extends EventPayloads<Event>,
>({
  initialStates,
  actions = {},
  events = {},
  filter = (states: States) => {
    return states;
  },
}: {
  initialStates: States;
  actions?: ActionReducers<States, Action, AP, Event, EP>;
  events?: EventReducers<States, Event, EP>;
  filter?: (states: States, player: Player, playerIndex: number) => States;
}) => {
  // tslint:disable-next-line:max-classes-per-file
  return class extends StatefulGame<States, Action, AP, Event, EP> {
    protected states = initialStates;
    protected actions = actions;
    protected events = events;
    protected filter = filter;
  };
};
