import { Game } from "@leancloud/client-engine";
import { Play, Player, Room } from "@leancloud/play";
import d = require("debug");
import produce from "immer";
import { Env, EventHandlers, EventPayloads } from "./core";

const debug = d("StatefulGame:Server");

export abstract class StatefulGame<
  States extends { [key: string]: any },
  Event extends string | number,
  EP extends EventPayloads<Event>
> extends Game {
  protected abstract states: States;
  protected abstract events: EventHandlers<Event, EP>;
  protected abstract filter: (
    states: States,
    player: Player,
    playerIndex: number,
  ) => States;

  constructor(room: Room, masterClient: Play) {
    super(room, masterClient);
    this.getStream("_event").subscribe(
      ({ eventData: { name, payload }, senderId }) =>
        this.internalEmitEvent(name, payload, Env.CLIENT, senderId - 2),
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

  private bindEmitEvent = (defaultEmitterIndex?: number) => <N extends Event>(
    name: N,
    payload?: EP[N],
    { emitterIndex = defaultEmitterIndex } = {},
  ) => this.internalEmitEvent(name, payload, Env.SERVER, emitterIndex)

  // tslint:disable-next-line:member-ordering
  protected emitEvent = this.bindEmitEvent();

  private internalEmitEvent<N extends Event>(
    name: N,
    payload?: EP[N],
    emitterEnv = Env.CLIENT,
    emitterIndex?: number,
  ) {
    debug("event: %o", { name, emitterIndex, payload });
    const handler = this.events[name];
    if (handler) {
      const context = {
        emitEvent: this.bindEmitEvent(emitterIndex),
        emitterEnv,
        emitterIndex,
        env: Env.SERVER,
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
  Event extends string | number,
  EP extends EventPayloads<Event>
>({
  initialStates,
  events = {},
  filter = (states: States) => {
    return states;
  },
}: {
  initialStates: States;
  events?: EventHandlers<Event, EP>;
  filter?: (states: States, player: Player, playerIndex: number) => States;
}) => {
  // tslint:disable-next-line:max-classes-per-file
  return class extends StatefulGame<States, Event, EP> {
    protected states = initialStates;
    protected events = events;
    protected filter = filter;
  };
};
