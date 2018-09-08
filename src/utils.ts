import { EventEmitter as PlayEventEmitter } from "@leancloud/play";
import { EventEmitter } from "events";

export function listen<T, K extends keyof T>(target: PlayEventEmitter<T>, resolveEvent: K, rejectEvent?: string) {
  return new Promise<T[K]>((resolve, reject) => {
    target.once(resolveEvent, resolve);
    if (rejectEvent) {
      target.once(rejectEvent, reject);
    }
  });
}

export function listenNodeEE<T>(target: EventEmitter, resolveEvent: string | symbol, rejectEvent?: string | symbol) {
  return new Promise<T>((resolve, reject) => {
    let rejectCallback: (error: Error) => any;
    const resolveCallback = (payload: T) => {
      if (rejectEvent) {
        target.off(rejectEvent, rejectCallback);
      }
      resolve(payload);
    };
    target.once(resolveEvent, resolveCallback);
    if (rejectEvent) {
      rejectCallback = (error) => {
        target.off(resolveEvent, resolveCallback);
        reject(error);
      };
      target.once(rejectEvent, rejectCallback);
    }
  });
}
