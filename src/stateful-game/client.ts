import { Event as PlayEvent, Play, ReceiverGroup } from "@leancloud/play";
import { EventEmitter } from "events";
import { Action as ReduxAction, AnyAction, createStore, Reducer, Store} from "redux";
import { devToolsEnhancer } from "redux-devtools-extension/developmentOnly";
import { Env, EventHandlers, EventPayloads, ReduxEventHandlers } from "./core";

abstract class StatefulGameBase<
  State extends { [key: string]: any },
  Event extends string | number,
  EP extends EventPayloads<Event>
> extends EventEmitter {
  public abstract get state(): State;

  public get players() {
    if (!this.client.room) {
      return [];
    }
    return this.client.room.playerList.filter(
      (player) => player !== this.client.room.master,
    );
  }

  protected abstract events: {
    [name in Event]?: (...args: any) => any;
  };

  constructor(
    protected client: Play,
  ) {
    super();
    this.client.on(
      PlayEvent.CUSTOM_EVENT,
      ({ eventId, eventData, senderId }) => {
        if (senderId !== this.client.room.masterId) {
          return;
        }
        if (eventId === "_update") {
          this.onUpdate(eventData as State);
        }
      },
    );
  }

  public emitEvent = <N extends Event>(name: N, payload?: EP[N]) => {
    this.sendEventToServer(name, payload);
    const handler = this.events[name];
    if (handler) {
      const context = {
        emitterEnv: Env.CLIENT,
        emitterId: this.client.player.actorId,
        env: Env.CLIENT,
        players: this.players,
      };
      handler(this.getStateOperators(), context, payload);
    }
  }

  protected abstract getStateOperators(): any;

  protected abstract onUpdate(nextState: State): any;

  protected emitStateUpdateEvent = () => {
    this.emit("state-update", this.state);
  }

  private sendEventToServer<N extends Event>(name: N, payload: any) {
    this.client.sendEvent(
      "_event",
      { name, payload },
      {
        receiverGroup: ReceiverGroup.MasterClient,
      },
    );
  }

}

// tslint:disable-next-line:max-classes-per-file
export class StatefulGame<
  State extends { [key: string]: any },
  Event extends string | number,
  EP extends EventPayloads<Event>
> extends StatefulGameBase<State, Event, EP> {
  public state: State;

  constructor(
    client: Play,
    initialState: State,
    protected events: EventHandlers<State, Event, EP>,
  ) {
    super(client);
    this.state = initialState;
  }

  protected getStateOperators() {
    return {
      emitEvent: this.emitEvent,
      getState: this.getState,
      setState: this.setState,
    };
  }

  private getState = () => this.state;
  private setState = (state: Partial<State>) => {
    this.state = {
      ...this.state,
      ...state,
    };
    this.emitStateUpdateEvent();
  }

  // tslint:disable-next-line:member-ordering
  protected onUpdate = this.setState;
}

const ACTION_REPLACE_STATE = "_REPLACE_STATE";
// tslint:disable-next-line:max-classes-per-file
export class ReduxGame<
  State extends { [key: string]: any },
  Action extends ReduxAction,
  Event extends string | number,
  EP extends EventPayloads<Event>
> extends StatefulGameBase<State, Event, EP> {
  public get state() {
    return this.store.getState();
  }

  private store: Store<State, Action>;
  constructor(
    client: Play,
    reducer: Reducer<State, Action>,
    protected events: ReduxEventHandlers<State, Event, EP>,
  ) {
    super(client);
    const rootReducer = (state: any , action: AnyAction) => {
      if (action.type === ACTION_REPLACE_STATE) {
        return reducer(action.payload, action as Action);
      }
      return reducer(state as State, action as Action);
    };
    this.store = createStore(rootReducer, devToolsEnhancer({}));
    this.store.subscribe(this.emitStateUpdateEvent);
  }

  protected getStateOperators() {
    return {
      dispatch: this.store.dispatch,
      emitEvent: this.emitEvent,
      getState: this.getState,
    };
  }

  protected onUpdate = (nextState: State) => this.store.dispatch(this.replaceState(nextState) as any);

  private replaceState = (nextState: State) => ({
    payload: nextState,
    type: ACTION_REPLACE_STATE,
  })

  private getState = () => this.state;
}

export const createGame = <
  State extends { [key: string]: any },
  Event extends string | number,
  EP extends EventPayloads<Event>
>({
  client,
  initialState,
  events = {},
}: {
  client: Play;
  initialState: State;
  events?: EventHandlers<State, Event, EP>;
}) => new StatefulGame(client, initialState, events);

export const createReduxGame = <
  State extends { [key: string]: any },
  Action extends ReduxAction,
  Event extends string | number,
  EP extends EventPayloads<Event>
>({
  client,
  reducer,
  events = {},
}: {
  client: Play;
  reducer: Reducer<State, Action>;
  events?: ReduxEventHandlers<State, Event, EP>;
}) => new ReduxGame(client, reducer, events);
