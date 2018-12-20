import { Event, Play, ReceiverGroup } from "@leancloud/play";
import { EventEmitter } from "events";
import produce from "immer";
import { ActionPayloads, GameActions } from "./core";

export class StatefulGame<
  States extends { [key: string]: any },
  Action extends string | number,
  AP extends ActionPayloads<Action>,
> extends EventEmitter {
  constructor(
    protected client: Play,
    public states: States,
    protected actions: GameActions<States, Action, AP>,
  ) {
    super();
    this.client.on(Event.CUSTOM_EVENT, ({ eventId, eventData, senderId}) => {
      if (senderId !== this.client.room.masterId) {
        return;
      }
      if (eventId === "_update") {
        this.updateStates(eventData as States);
      }
    });
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

  public dispatchAction<N extends Action>(name: N, payload?: AP[N]) {
    this.sendActionToServer(name, payload);
    const handler = this.actions[name];
    if (handler) {
      const context = {
        actionSenderIndex: this.clientIndex,
        dispatchEvent: this.dispatchEvent,
        players: this.players,
      };
      this.updateStates(produce(this.states, (draft) =>
        handler(draft as States, context, payload),
      ));
    }
  }

  private sendActionToServer<N extends Action>(name: N, payload: any) {
    this.client.sendEvent("_action", { name, payload }, {
      receiverGroup: ReceiverGroup.MasterClient,
    });
  }

  private updateStates(states: States) {
    this.states = states;
    this.emit("states-update", this.states);
  }

  private dispatchEvent = () => undefined;
}

export const createGame = <
  States extends { [key: string]: any },
  Action extends string | number,
  AP extends ActionPayloads<Action>,
>({
  client,
  initialStates,
  actions = {},
}: {
  client: Play,
  initialStates: States;
  actions?: GameActions<States, Action, AP>;
}) => new StatefulGame(client, initialStates, actions);
