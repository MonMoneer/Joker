"use client";

import type { HandScore, Player, SetNumber } from "@joker/engine";
import { getHandSequence } from "@joker/engine";

interface ScoreBoardProps {
  players: Player[];
  scores: number[];
  handScores: HandScore[][];
  currentHand: number;
  kingsBySet?: Record<number, number[]>; // setNumber → player indices who are kings
}

// Detect which hands are set boundaries (last hand of each set)
const HAND_SEQUENCE = getHandSequence();
const SET_LAST_HANDS = new Set([8, 12, 20, 24]); // last hand numbers of each set

function getSetForHand(handIdx: number): number {
  return HAND_SEQUENCE[handIdx]?.setNumber || 1;
}

export function ScoreBoard({
  players,
  scores,
  handScores,
  currentHand,
  kingsBySet = {},
}: ScoreBoardProps) {
  // Build a map of which players are king in which set-end row
  const kingAtRow: Record<number, number[]> = {};
  for (const [setNum, playerIndices] of Object.entries(kingsBySet)) {
    // Find the last hand index for this set
    const lastHandIdx = HAND_SEQUENCE.findIndex(
      (h) => h.setNumber === Number(setNum) && SET_LAST_HANDS.has(h.handNumber)
    );
    if (lastHandIdx >= 0) {
      kingAtRow[lastHandIdx] = playerIndices;
    }
  }

  return (
    <div className="score-panel p-5 max-h-[70vh] overflow-y-auto min-w-[300px] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold text-gold-300">
          Score Sheet
        </h3>
        <span className="px-3 py-1 rounded-full bg-gold-600/20 text-gold-300 text-[10px] font-body font-bold uppercase tracking-wider">
          Active Hand: {currentHand}/24
        </span>
      </div>

      <table className="w-full text-xs font-body">
        <thead>
          <tr className="border-b border-gold-600/10">
            <th className="py-2 text-left text-marble-500 text-[10px] font-bold w-8">#</th>
            {players.map((p) => (
              <th key={p.id} className="py-2 text-center text-marble-300 font-semibold text-[11px]">
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {handScores.map((hand, idx) => {
            const isSetEnd = SET_LAST_HANDS.has(idx + 1);
            const kingsHere = kingAtRow[idx] || [];

            return (
              <tr
                key={idx}
                className={`transition-colors hover:bg-white/5 ${
                  idx + 1 === currentHand ? "score-row-current" : ""
                } ${isSetEnd ? "border-b-2 border-b-gold-600/20" : "border-b border-white/5"}`}
              >
                <td className="py-1.5 text-gold-600/60 font-mono text-[10px]">{idx + 1}</td>
                {hand.map((score, pIdx) => {
                  const isKing = kingsHere.includes(pIdx);
                  return (
                    <td key={pIdx} className="py-1.5 text-center font-mono relative">
                      {/* Crown for King */}
                      {isKing && (
                        <span
                          className="absolute -top-1 -left-0.5 text-[10px] select-none"
                          style={{ transform: "rotate(-45deg)" }}
                          title="King of the Set!"
                        >
                          👑
                        </span>
                      )}
                      <span className="text-marble-500/40 text-[8px]">{score.bid} </span>
                      <span className={
                        score.isHistPenalty
                          ? "text-error-500 font-bold"
                          : score.isSuccess
                            ? "text-gold-300"
                            : "text-error-500"
                      }>
                        {score.score > 0 ? "+" : ""}{score.score}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {/* Empty future rows */}
          {Array.from({ length: Math.max(0, 24 - handScores.length) }, (_, i) => (
            <tr key={`future-${i}`} className="border-b border-white/3" style={{ opacity: Math.max(0.15, 0.4 - i * 0.02) }}>
              <td className="py-1.5 text-marble-500/20 font-mono text-[10px]">{handScores.length + i + 1}</td>
              {players.map((_, pIdx) => (
                <td key={pIdx} className="py-1.5 text-center text-marble-500/15 font-mono">—</td>
              ))}
            </tr>
          )).slice(0, 6)}
        </tbody>
      </table>

      {/* Totals footer */}
      <div className="mt-4 pt-3 border-t border-gold-600/20 flex items-center">
        <span className="text-[10px] font-body font-black text-gold-600 uppercase tracking-wider pr-3 mr-3 border-r border-gold-600/15">
          Total<br/>Scores
        </span>
        <div className="flex-1 grid grid-cols-4 gap-2">
          {players.map((p, i) => (
            <div key={p.id} className="text-center">
              <div className="text-[8px] font-body font-semibold text-marble-400/50 uppercase">{p.name}</div>
              <div className="font-display text-base font-bold text-gold-300">{scores[i]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
