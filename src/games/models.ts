export type UNKNOWN = -1;
export const UNKNOWN_CHOICE: UNKNOWN = -1;

export type ValidChoice =  0 | 1 | 2 ;
export type Choice = ValidChoice|  null | UNKNOWN;
// tslint:disable-next-line:interface-over-type-literal
export type Result = { winnerId?: string , draw?: boolean };

export const options = ["👊", "✌️", "🖐️"];

// [2 🖐️, 0 👊, 1 ✌️] beats [0 👊, 1 ✌️, 2 🖐️]
// consider A = 1 ✌️
// if B = beats[1] = 0 👊; then B wins
export const beats = [2, 0, 1];
