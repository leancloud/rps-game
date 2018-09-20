import GameManager from "../src/game-manager";
import RPSGame from "../src/rps-game";

const gameManager = new GameManager(RPSGame, {
  concurrency: 2,
  reservationHoldTime: 10000000,
});

const PLAYER_COUNT = 1000;

for (let i = 0; i < PLAYER_COUNT; i++) {
  gameManager.makeReservation(i.toString()).then(() => console.log(gameManager.getStatus()));
}
