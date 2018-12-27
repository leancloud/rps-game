import { Event as PlayEvent, Play, ReceiverGroup } from "@leancloud/play";
import { EventEmitter } from "events";
import produce from "immer";
import { Env, EventHandlers, EventPayloads } from "./core";

export class StatefulGame<
  State extends { [key: string]: any },
  Event extends string | number,
  EP extends EventPayloads<Event>
> extends EventEmitter {
  constructor(
    protected client: Play,
    public state: State,
    protected events: EventHandlers<State, Event, EP>,
  ) {
    super();
    this.client.on(
      PlayEvent.CUSTOM_EVENT,
      ({ eventId, eventData, senderId }) => {
        if (senderId !== this.client.room.masterId) {
          return;
        }
        if (eventId === "_update") {
          this.setState(eventData as State);
        }
      },
    );
  }

  public get players() {
    if (!this.client.room) {
      return [];
    }
    return this.client.room.playerList.filter(
      (player) => player !== this.client.room.master,
    );
  }

  public get clientIndex() {
    if (!this.client.player) {
      return -1;
    }
    return this.client.player.actorId - 2;
  }

  public emitEvent = <N extends Event>(name: N, payload?: EP[N]) => {
    this.sendEventToServer(name, payload);
    const handler = this.events[name];
    if (handler) {
      const context = {
        emitEvent: this.emitEvent,
        emitterEnv: Env.CLIENT,
        emitterIndex: this.clientIndex,
        env: Env.CLIENT,
        players: this.players,
      };
      handler({
        getState: this.getState,
        setState: this.setState,
      }, context, payload);
    }
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

  private getState = () => this.state;
  private setState = (state: Partial<State>) => {
    this.state = {
      ...this.state,
      ...state,
    };
    this.emit("state-update", this.state);
  }
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
