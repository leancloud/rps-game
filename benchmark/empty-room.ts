import GameManager from "../src/game-manager";
import RPSGame from "../src/rps-game";

class LongWaitingRPSGame extends RPSGame {
  public reservationHoldTime = 10000000;
}

const gameManager = new GameManager(LongWaitingRPSGame, {
  concurrency: 2,
});

const PLAYER_COUNT = 1000;

for (let i = 0; i < PLAYER_COUNT; i++) {
  gameManager.makeReservation(i.toString()).then(() => console.log(gameManager.getStatus()));
}
