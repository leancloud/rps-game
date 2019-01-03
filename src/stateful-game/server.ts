import { Game } from "@leancloud/client-engine";
import { Play, Player, Room } from "@leancloud/play";
import d = require("debug");
import { debounce } from "lodash-decorators";
import { Action as ReduxAction, createStore, Dispatch, Reducer, Store} from "redux";
import { Env, EventHandlers, EventPayloads, ReduxEventHandlers } from "./core";

const debug = d("StatefulGame:Server");

export abstract class StatefulGame<
  State extends { [key: string]: any },
  Event extends string | number,
  EP extends EventPayloads<Event>
> extends Game {
  protected abstract get state(): State;

  protected abstract events: {
    [name in Event]?: (...args: any) => any;
  };
  protected abstract filter: (
    state: State,
    player: Player,
  ) => State;

  constructor(room: Room, masterClient: Play) {
    super(room, masterClient);
    this.getStream("_event").subscribe(
      ({ eventData: { name, payload }, senderId}) =>
        this.internalEmitEvent(name, payload, Env.CLIENT, room.getPlayer(senderId)),
    );
  }

  protected abstract getStateOperators(): any;

  @debounce(0)
  protected broadcastState() {
    debug("broadcast state: %o", this.state);
    this.players.map((player) =>
      this.masterClient.sendEvent(
        "_update",
        this.filter(this.state, player),
        {
          targetActorIds: [player.actorId],
        },
      ),
    );
  }

  private bindEmitEvent = (defaultEmitter?: Player) => <N extends Event>(
    name: N,
    payload?: EP[N],
    { emitter = defaultEmitter } = {},
  ) => this.internalEmitEvent(name, payload, Env.SERVER, emitter)

  // tslint:disable-next-line:member-ordering
  protected emitEvent = this.bindEmitEvent();

  private internalEmitEvent<N extends Event>(
    name: N,
    payload?: EP[N],
    emitterEnv = Env.CLIENT,
    emitter?: Player,
  ) {
    debug("event: %o", { name, payload, emitterId: emitter ? emitter.userId : undefined });
    const handler = this.events[name];
    if (handler) {
      const context = {
        emitEvent: this.bindEmitEvent(emitter),
        emitter,
        emitterEnv,
        env: Env.SERVER,
        players: this.players,
      };
      handler(this.getStateOperators(), context, payload),
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
  filter?: (state: State, player: Player) => State;
}) => {
  // tslint:disable-next-line:max-classes-per-file
  return class extends StatefulGame<State, Event, EP> {
    protected state = initialState;
    protected events = events;
    protected filter = filter;

    protected getState = () => this.state;
    protected setState = (state: Partial<State>) => {
      this.state = {
        ...this.state,
        ...state,
      };
      this.broadcastState();
    }

    protected getStateOperators() {
      return {
        emitEvent: this.emitEvent,
        getState: this.getState,
        setState: this.setState,
      };
    }
  };
};

export const defineReduxGame = <
  State extends { [key: string]: any },
  Action extends ReduxAction,
  Event extends string | number,
  EP extends EventPayloads<Event>
>({
  reducer,
  events = {},
  filter = (state: State) => {
    return state;
  },
}: {
  reducer: Reducer<State, Action>,
  events?: ReduxEventHandlers<State, Event, EP>;
  filter?: (state: State, player: Player) => State;
}) => {
  // tslint:disable-next-line:max-classes-per-file
  return class extends StatefulGame<State, Event, EP> {
    protected get state() {
      return this.store.getState();
    }
    protected events = events;
    protected filter = filter;

    protected dispatch: Dispatch<Action>;
    private store: Store<State, Action>;

    constructor(room: Room, masterClient: Play) {
      super(room, masterClient);
      this.store = createStore(reducer);
      this.store.subscribe(this.broadcastState.bind(this));
      this.dispatch = this.store.dispatch;
    }
    protected getState = () => this.state;
    protected getStateOperators() {
      return {
        dispatch: this.store.dispatch,
        emitEvent: this.emitEvent,
        getState: this.getState,
      };
    }
  };
};
