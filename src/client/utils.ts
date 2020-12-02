import { Player } from "@leancloud/play";

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
      isLocal: player.isLocal,
      isMaster: player.isMaster,
      userId,
    };
  });
