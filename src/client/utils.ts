import { EventEmitter as PlayEventEmitter, Player, PlayEvent } from "@leancloud/play";
import { isMaster } from "cluster";

class WrappedPlayError extends Error {
  constructor(message: string, public code?: number) {
    super(message);
  }
}

export function listen<
  T extends PlayEvent,
  K extends keyof T,
  L extends keyof T
>(target: PlayEventEmitter<T>, resolveEvent: K, rejectEvent?: L) {
  return new Promise<T[K]>((resolve, reject) => {
    let rejectCallback: (error: T[L]) => any;
    const resolveCallback = (payload: T[K]) => {
      if (rejectEvent) {
        target.off(rejectEvent, rejectCallback);
      }
      resolve(payload);
    };
    target.once(resolveEvent, resolveCallback);
    if (rejectEvent) {
      rejectCallback = (error) => {
        target.off(resolveEvent, resolveCallback);
        if (error instanceof Error) {
          reject(error);
        } else {
          const {
            detail,
            code,
          } = error as any;
          const wrappedError = new WrappedPlayError(detail || JSON.stringify(error));
          if (code) {
            wrappedError.code = code;
          }
          reject(wrappedError);
        }
      };
      target.once(rejectEvent, rejectCallback);
    }
  });
}

interface IErrorEvent {
  code: number;
  detail: string;
}

export const errorHandler = (error: IErrorEvent) => {
  // eslint-disable-next-line
  console.error(`${error.code}: ${error.detail}`);
};

export const jsonfyPlayers = (players: Player[]) =>
  players.map((player) => {
    const { userId, actorId } = player;
    return {
      actorId,
      isLocal: player.isLocal(),
      isMaster: player.isMaster(),
      userId,
    };
  });
