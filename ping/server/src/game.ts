// --- Types ---

import { runInNewContext } from "vm";

export type SetScore = [number, number];

export interface PlayerState {
  name: string;
  points: number; // points in the current set
  sets: number;   // sets won
  offences: number;
  isServing: boolean;
}

export interface State {
  players: [PlayerState, PlayerState];
  totalSets: number;
  currentSet: number;
  setHistory: SetScore[];
  winner: 0 | 1 | null;
}

// --- Factory ---

export function makeState(
  player1Name: string,
  player2Name: string,
  totalSets: number
): State {
  return {
    players: [
      { name: player1Name, points: 0, sets: 0, offences: 0, isServing: true },
      { name: player2Name, points: 0, sets: 0, offences: 0, isServing: false },
    ],
    totalSets,
    currentSet: 1,
    setHistory: [],
    winner: null,
  };
}

// --- Game logic ---

export function checkSetWinner(state: State): 0 | 1 | null {
  const [p0, p1] = state.players;
  for (const i of [0, 1] as const) {
    const mine = i === 0 ? p0.points : p1.points;
    const theirs = i === 0 ? p1.points : p0.points;
    if (mine >= 11 && mine - theirs >= 2) return i;
  }
  return null;
}

// --- feature 1 Current server ---
export function setServer(state: State) {
  let totalPoints = state.players[0].points + state.players[1].points;
  let serveSwitch = null;

  if (state.players[0].points >= 10 && state.players[1].points >= 10) {
    serveSwitch = true
  } else {
    serveSwitch = totalPoints % 2 === 0;
  }

  if (serveSwitch) {
    state.players[0].isServing = !state.players[0].isServing;
    state.players[1].isServing = !state.players[1].isServing;
  }
}
export function addOffence(state: State, playerIndex: 0 | 1): State {
  const next: State = {
    ...state,
    players: [
      { ...state.players[0] },
      { ...state.players[1] },
    ],
    setHistory: [...state.setHistory],
  };

  next.players[playerIndex].offences++;
  return checkOffences(next, playerIndex)
}

export function checkOffences(state: State, playerIndex: 0 | 1) {
  const next = state
  const offender = next.players[playerIndex];
  const beneficiaryIndex = (playerIndex ^ 1) as 0 | 1;

  if (offender.offences >= 4) {
    next.winner = beneficiaryIndex;
    return next;
  }

  let pointsToAward = 0;
  if (offender.offences === 2) pointsToAward = 1;
  if (offender.offences === 3) pointsToAward = 2;


  for (let i = 0; i < pointsToAward; i++) {
    if (next.winner !== null) break;

    const stateAfterPoint = updateState(next, beneficiaryIndex);

    Object.assign(next, stateAfterPoint);
  }

  return next;
}

export function updateState(state: State, playerIndex: 0 | 1): State {
  if (state.winner !== null) return state;

  const next: State = {
    ...state,
    players: [
      { ...state.players[0] },
      { ...state.players[1] },
    ],
    setHistory: [...state.setHistory],
  };

  next.players[playerIndex].points++;

  const setsToWin = Math.ceil(next.totalSets / 2);
  const setWinner = checkSetWinner(next);
  setServer(next);

  if (setWinner !== null) {
    next.setHistory.push([next.players[0].points, next.players[1].points]);
    next.players[setWinner].sets++;

    if (next.players[setWinner].sets === setsToWin) {
      next.winner = setWinner;
    } else {
      next.players[0].points = 0;
      next.players[1].points = 0;
      next.currentSet++;
    }
  }

  return next;
}
