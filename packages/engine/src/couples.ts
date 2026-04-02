import type { PlayerId, PlayerIndex, GameSettings } from './types';

/**
 * Creates couple pairings from player selections.
 * In couples mode, 2 teams of 2 players play against each other.
 * Players choose their partner before the game starts.
 *
 * @param player1 - First couple: player A
 * @param player2 - First couple: player B
 * @returns Updated settings with couple assignments
 */
export function setCouples(
  settings: GameSettings,
  coupleA: [PlayerId, PlayerId],
  coupleB: [PlayerId, PlayerId]
): GameSettings {
  return {
    ...settings,
    couplesMode: true,
    couples: [coupleA, coupleB],
  };
}

/**
 * Gets the partner of a given player in couples mode.
 * @returns Partner's player ID, or null if not in couples mode
 */
export function getPartner(
  playerId: PlayerId,
  settings: GameSettings
): PlayerId | null {
  if (!settings.couplesMode || !settings.couples) return null;

  for (const couple of settings.couples) {
    if (couple[0] === playerId) return couple[1];
    if (couple[1] === playerId) return couple[0];
  }

  return null;
}

/**
 * Gets the opponent couple for a given player.
 * @returns Array of opponent player IDs
 */
export function getOpponents(
  playerId: PlayerId,
  settings: GameSettings,
  allPlayerIds: PlayerId[]
): PlayerId[] {
  if (!settings.couplesMode || !settings.couples) {
    return allPlayerIds.filter(id => id !== playerId);
  }

  const partner = getPartner(playerId, settings);
  return allPlayerIds.filter(id => id !== playerId && id !== partner);
}

/**
 * Calculates combined team scores from individual scores.
 *
 * @param scores - Individual player scores (4 elements)
 * @param playerIds - Player IDs corresponding to scores
 * @param settings - Game settings with couple assignments
 * @returns Object with team scores: { teamA: number, teamB: number }
 */
export function getCombinedTeamScores(
  scores: number[],
  playerIds: PlayerId[],
  settings: GameSettings
): { teamA: number; teamB: number } | null {
  if (!settings.couplesMode || !settings.couples || settings.couples.length !== 2) {
    return null;
  }

  const [coupleA, coupleB] = settings.couples;

  const teamAScore = scores.reduce((sum, score, i) => {
    if (coupleA.includes(playerIds[i])) return sum + score;
    return sum;
  }, 0);

  const teamBScore = scores.reduce((sum, score, i) => {
    if (coupleB.includes(playerIds[i])) return sum + score;
    return sum;
  }, 0);

  return { teamA: teamAScore, teamB: teamBScore };
}

/**
 * Determines the winning team based on combined scores.
 * @returns 'A', 'B', or 'tie'
 */
export function getWinningTeam(
  scores: number[],
  playerIds: PlayerId[],
  settings: GameSettings
): 'A' | 'B' | 'tie' | null {
  const teamScores = getCombinedTeamScores(scores, playerIds, settings);
  if (!teamScores) return null;

  if (teamScores.teamA > teamScores.teamB) return 'A';
  if (teamScores.teamB > teamScores.teamA) return 'B';
  return 'tie';
}

/**
 * Checks if two players are on the same team.
 */
export function areTeammates(
  playerA: PlayerId,
  playerB: PlayerId,
  settings: GameSettings
): boolean {
  if (!settings.couplesMode || !settings.couples) return false;

  for (const couple of settings.couples) {
    if (couple.includes(playerA) && couple.includes(playerB)) return true;
  }

  return false;
}
