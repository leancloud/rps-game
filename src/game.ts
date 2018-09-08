import {
  CustomEventData,
  Event,
  Play,
  Player,
  PlayEvent,
  ReceiverGroup,
  Room,
} from "@leancloud/play";
import { EventEmitter } from "events";
import _ = require("lodash");
import { fromEvent, timer } from "rxjs";
import { filter, first, takeUntil, tap } from "rxjs/operators";

type CustomEventId = number | string;
interface ICustomEventPayload {
  eventId: CustomEventId;
  eventData: CustomEventData;
  senderId: number;
}

export default abstract class Game extends EventEmitter {
  /**
   * 每局游戏玩家数量限制。
   */
  public static playerLimit = 2;

  public registeredPlayers = new Set<string>();
  public get availableSeatCount() {
    return (
      this.room.maxPlayerCount -
      this.room.playerList.length -
      this.registeredPlayers.size
    );
  }

  /**
   * 匹配成功后座位的保留时间，超过这个时间后该座位将被释放。
   */
  public reservationHoldTime = 10000;

  /**
   * 不包含 masterClient 的玩家列表。
   */
  public get players() {
    return this.room.playerList.filter(
      (player) => player !== this.masterClient.player,
    );
  }

  /**
   * customEvents Observable
   */
  public customEvents = fromEvent<PlayEvent[Event.CUSTOM_EVENT]>(
    this.masterClient,
    Event.CUSTOM_EVENT,
  );

  constructor(public room: Room, public masterClient: Play) {
    super();
    this.customEvents.subscribe(console.log)
  }

  /**
   * 向玩家广播自定义事件。
   */
  public broadcast(
    eventId: CustomEventId,
    eventData: { [key: string]: any } = {},
    options: {
      exclude?: number[],
    } = {},
  ) {
    if (options.exclude !== undefined) {
      return this.masterClient.sendEvent(eventId, eventData, {
        targetActorIds: _.difference(this.players.map((player) => player.actorId), options.exclude),
      });
    }
    return this.masterClient.sendEvent(eventId, eventData, {
      receiverGroup: ReceiverGroup.Others,
    });
  }

  /**
   * 向其他玩家转发自定义事件。
   * 该方法会在转发后的事件内容中增加 originalSenderId 字段。
   * @param originalEvent 原始事件
   * @param transform 变形事件内容
   * @param eventId 指定新的事件 ID
   */
  public forwardToTheRests(
    originalEvent: ICustomEventPayload,
    transform: (originalEventData: CustomEventData) => CustomEventData = (data) => data,
    eventId: CustomEventId = originalEvent.eventId,
  ) {
    const {
      senderId,
      eventData,
    } = originalEvent;
    return this.broadcast(
      eventId,
      {
        ...transform(eventData),
        originalSenderId: senderId,
      },
      {
        exclude: [senderId],
      },
    );
  }

  /**
   * 获取指定的自定义事件，指定 player 发送的事件流。
   * 参阅 http://reactivex.io/rxjs 了解更多。
   */
  public getStream(eventId: CustomEventId, player?: Player, timeout?: number) {
    return this.customEvents.pipe(
      filter(({ eventId: evId }) => evId === eventId),
      player === undefined ? tap() : filter(({ senderId }) => senderId === player.actorId),
      timeout === undefined ? tap() : takeUntil(timer(timeout)),
    );
  }

  /**
   * 获取指定的自定义事件，指定 player 发送的第一个事件的流。
   * 参阅 http://reactivex.io/rxjs 了解更多。
   */
  public takeFirst(eventId: CustomEventId, player?: Player, timeout?: number) {
    return this.getStream(eventId, player).pipe(first());
  }
}

export const GameEvent = {
  END: Symbol("End"),
};
