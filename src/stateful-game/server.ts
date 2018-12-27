import { Game } from "@leancloud/client-engine";
import { Play, Player, Room } from "@leancloud/play";
import d = require("debug");
import { debounce } from "lodash-decorators";
import { Env, EventHandlers, EventPayloads } from "./core";

const debug = d("StatefulGame:Server");

export abstract class StatefulGame<
  State extends { [key: string]: any },
  Event extends string | number,
  EP extends EventPayloads<Event>
> extends Game {
  protected abstract state: State;
  protected abstract events: EventHandlers<State, Event, EP>;
  protected abstract filter: (
    state: State,
    player: Player,
    playerIndex: number,
  ) => State;

  constructor(room: Room, masterClient: Play) {
    super(room, masterClient);
    this.getStream("_event").subscribe(
      ({ eventData: { name, payload }, senderId }) =>
        this.internalEmitEvent(name, payload, Env.CLIENT, senderId - 2),
    );
  }

  protected getState = () => this.state;
  protected setState = (state: Partial<State>) => {
    this.state = {
      ...this.state,
      ...state,
    };
    this.broadcastState();
  }

  @debounce(0)
  protected broadcastState() {
    debug("broadcast state: %o", this.state);
    this.players.map((player) =>
      this.masterClient.sendEvent(
        "_update",
        this.filter(this.state, player, player.actorId - 2),
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
      handler({
        getState: this.getState,
        setState: this.setState,
      }, context, payload),
      this.broadcastState();
    }
  }
}

export const defineGame = <
  State extends { [key: string]: any },
  Event extends string | number,
  EP extends EventPayloads<Event>
>({
  initialState,
  events = {},
  filter = (state: State) => {
    return state;
  },
}: {
  initialState: State;
  events?: EventHandlers<State, Event, EP>;
  filter?: (state: State, player: Player, playerIndex: number) => State;
}) => {
  // tslint:disable-next-line:max-classes-per-file
  return class extends StatefulGame<State, Event, EP> {
    protected state = initialState;
    protected events = events;
    protected filter = filter;
  };
};
