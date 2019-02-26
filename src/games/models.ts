export type UNKNOWN = -1;
export const UNKNOWN_CHOICE: UNKNOWN = -1;

export type ValidChoice =  0 | 1 | 2 ;
export type Choice = ValidChoice|  null | UNKNOWN;
// tslint:disable-next-line:interface-over-type-literal
export type Result = { winnerId?: string , draw?: boolean };

// [0 ✊, 1 ✌️, 2 ✋] wins [1 ✌️, 2 ✋, 0 ✊]
export const wins = [1, 2, 0];
