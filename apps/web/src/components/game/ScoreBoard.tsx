"use client";

import type { HandScore, Player } from "@joker/engine";

interface ScoreBoardProps {
  players: Player[];
  scores: number[];
  handScores: HandScore[][];
  currentHand: number;
}

export function ScoreBoard({
  players,
  scores,
  handScores,
  currentHand,
}: ScoreBoardProps) {
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
          {handScores.map((hand, idx) => (
            <tr
              key={idx}
              className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                idx + 1 === currentHand ? "score-row-current" : ""
              }`}
            >
              <td className="py-1.5 text-gold-600/60 font-mono text-[10px]">{idx + 1}</td>
              {hand.map((score, pIdx) => (
                <td key={pIdx} className="py-1.5 text-center font-mono">
                  <span className="text-marble-500/40 text-[8px]">{score.bid} </span>
                  <span className={score.isSuccess ? "text-gold-300" : "text-error-500"}>
                    {score.score > 0 ? "+" : ""}{score.score}
                  </span>
                </td>
              ))}
            </tr>
          ))}
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
