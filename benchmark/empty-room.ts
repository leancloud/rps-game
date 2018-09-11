import Reception from "../src/reception";
import RPSGame from "../src/rps-game";

class LongWaitingRPSGame extends RPSGame {
  public reservationHoldTime = 10000000;
}

const reception = new Reception(LongWaitingRPSGame);

const PLAYER_COUNT = 1000;

for (let i = 0; i < PLAYER_COUNT; i++) {
  reception.makeReservation(i.toString());
}
