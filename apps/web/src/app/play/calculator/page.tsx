"use client";

import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/ui/BottomNav";
import { PlayerPicker } from "@/components/ui/PlayerPicker";
import {
  getHandSequence,
  calculateAllHandScores,
  applyKingRule,
  updateKingTracking,
} from "@joker/engine";
import type {
  HandScore,
  GameSettings,
  SetNumber,
} from "@joker/engine";
import type { UserProfile } from "@/lib/user-system";

interface HandEntry {
  bids: number[];
  tricks: number[];
  completed: boolean;
}

interface PlayerSlot {
  name: string;
  linkedUser: UserProfile | null; // null = guest, UserProfile = registered user
}

export default function CalculatorPage() {
  const [players, setPlayers] = useState<PlayerSlot[]>([
    { name: "", linkedUser: null },
    { name: "", linkedUser: null },
    { name: "", linkedUser: null },
    { name: "", linkedUser: null },
  ]);
  const [started, setStarted] = useState(false);
  const [histPenalty, setHistPenalty] = useState(false);
  const [histAmount, setHistAmount] = useState<-200 | -500>(-200);
  const [entries, setEntries] = useState<HandEntry[]>([]);
  const [currentHand, setCurrentHand] = useState(0);
  const [showScoreTable, setShowScoreTable] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);

  const handSequence = useMemo(() => getHandSequence(), []);
  const playerNames = players.map((p) => p.name);
  const settings: GameSettings = {
    histPenalty,
    histPenaltyAmount: histAmount,
    couplesMode: false,
  };

  // Compute cumulative scores and running totals per hand
  const scores = useMemo(() => {
    const cumulative = [0, 0, 0, 0];
    const allHandScores: HandScore[][] = [];
    const runningTotals: number[][] = []; // runningTotals[handIdx][playerIdx]
    let setHandScores: HandScore[][] = [];
    let allBidsSucceeded = [true, true, true, true];
    let currentSet: SetNumber = 1;

    for (const entry of entries) {
      if (!entry.completed) continue;

      const handIdx = allHandScores.length;
      const handConfig = handSequence[handIdx];

      if (handConfig.setNumber !== currentSet) {
        const { adjustedScores } = applyKingRule(
          setHandScores,
          currentSet,
          settings,
          cumulative
        );
        for (let i = 0; i < 4; i++) cumulative[i] = adjustedScores[i];
        setHandScores = [];
        allBidsSucceeded = [true, true, true, true];
        currentSet = handConfig.setNumber;
      }

      const handScores = calculateAllHandScores(
        entry.bids,
        entry.tricks,
        handConfig.cardsPerPlayer,
        settings
      );
      allHandScores.push(handScores);
      setHandScores.push(handScores);
      allBidsSucceeded = updateKingTracking(allBidsSucceeded, handScores);

      for (let i = 0; i < 4; i++) {
        cumulative[i] += handScores[i].score;
      }

      if (
        handConfig.handInSet ===
        (handConfig.setNumber === 2 || handConfig.setNumber === 4 ? 4 : 8)
      ) {
        const { adjustedScores } = applyKingRule(
          setHandScores,
          currentSet,
          settings,
          cumulative
        );
        for (let i = 0; i < 4; i++) cumulative[i] = adjustedScores[i];
      }

      runningTotals.push([...cumulative]);
    }

    return { cumulative, allHandScores, runningTotals };
  }, [entries, settings, handSequence]);

  const startCalculator = () => {
    if (players.some((p) => !p.name.trim())) return;
    setStarted(true);
    setEntries(
      handSequence.map(() => ({
        bids: [0, 0, 0, 0],
        tricks: [0, 0, 0, 0],
        completed: false,
      }))
    );
  };

  const updateEntry = (
    handIdx: number,
    field: "bids" | "tricks",
    playerIdx: number,
    value: number
  ) => {
    setEntries((prev) => {
      const next = [...prev];
      next[handIdx] = {
        ...next[handIdx],
        [field]: next[handIdx][field].map((v, i) =>
          i === playerIdx ? value : v
        ),
      };
      return next;
    });
  };

  const submitHand = (handIdx: number) => {
    const entry = entries[handIdx];
    const totalTricks = entry.tricks.reduce((s, t) => s + t, 0);
    const expected = handSequence[handIdx].cardsPerPlayer;
    if (totalTricks !== expected) {
      alert(
        `Total tricks (${totalTricks}) must equal cards dealt (${expected})`
      );
      return;
    }
    setEntries((prev) => {
      const next = [...prev];
      next[handIdx] = { ...next[handIdx], completed: true };
      return next;
    });
    if (handIdx < 23) setCurrentHand(handIdx + 1);
  };

  const leadingPlayer = scores.cumulative.indexOf(
    Math.max(...scores.cumulative)
  );

  const updatePlayerName = (idx: number, name: string) => {
    setPlayers((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, name } : p))
    );
  };

  const linkPlayer = (idx: number, user: UserProfile | null) => {
    setPlayers((prev) =>
      prev.map((p, i) =>
        i === idx
          ? { ...p, linkedUser: user, name: user ? user.nickname : p.name }
          : p
      )
    );
  };

  // Check if a hand is the first hand in a new set (for set separators)
  const isSetBoundary = (handIdx: number) => {
    if (handIdx === 0) return false;
    return (
      handSequence[handIdx].setNumber !== handSequence[handIdx - 1].setNumber
    );
  };

  // ── Setup View ──
  if (!started) {
    return (
      <div className="royal-bg font-body flex flex-col min-h-screen">
        <main className="flex-1 flex flex-col items-center justify-center px-5 pb-28">
          <motion.div
            className="max-w-md w-full"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h1 className="font-display text-4xl font-bold text-gold-300 mb-2">
                Score Calculator
              </h1>
              <p className="text-sm text-marble-400/40 uppercase tracking-[0.2em] font-body">
                Track every hand
              </p>
            </div>

            <div className="glass-panel p-6 space-y-4">
              <p className="text-[10px] text-marble-400/30 mb-2">
                Type a name or search @nickname to invite registered players
              </p>
              {players.map((player, i) => (
                <PlayerPicker
                  key={i}
                  index={i}
                  label={`Player ${i + 1}`}
                  value={player.name}
                  onChange={(name) => updatePlayerName(i, name)}
                  onUserLinked={(user) => linkPlayer(i, user)}
                  linkedUser={player.linkedUser}
                  placeholder={`Name or @nickname`}
                />
              ))}

              <div className="h-px bg-gold-400/10" />

              <div className="flex items-center justify-between">
                <span className="text-sm text-marble-300 font-body">
                  Hist Penalty
                </span>
                <button
                  onClick={() => setHistPenalty(!histPenalty)}
                  className={`relative w-14 h-8 rounded-full transition-all duration-200 ${
                    histPenalty
                      ? "bg-amber-500 shadow-[0_0_12px_rgba(253,195,77,0.3)]"
                      : "bg-navy-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform duration-200 ${
                      histPenalty ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {histPenalty && (
                <motion.div
                  className="flex gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {([-200, -500] as const).map((amt) => (
                    <button
                      key={amt}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                        histAmount === amt
                          ? "bg-amber-500 text-navy-900"
                          : "bg-navy-700 text-marble-400/60"
                      }`}
                      onClick={() => setHistAmount(amt)}
                    >
                      {amt}
                    </button>
                  ))}
                </motion.div>
              )}

              <button
                className="btn-gold w-full py-4 text-lg mt-2"
                onClick={startCalculator}
                disabled={players.some((p) => !p.name.trim())}
              >
                START SCORING
              </button>
            </div>
          </motion.div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const handConfig = handSequence[currentHand];
  const entry = entries[currentHand];

  // ── Active Scoring View ──
  return (
    <div className="royal-bg font-body flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col px-3 pt-3 pb-28 max-w-3xl mx-auto w-full">
        {/* Toggle: Score Table / Entry Mode */}
        <div className="flex gap-2 mb-3">
          <button
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              showScoreTable
                ? "bg-gold-700/30 text-gold-400 border border-gold-400/30"
                : "bg-navy-800/60 text-marble-400/40"
            }`}
            onClick={() => setShowScoreTable(true)}
          >
            Score Table
          </button>
          <button
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              !showScoreTable
                ? "bg-gold-700/30 text-gold-400 border border-gold-400/30"
                : "bg-navy-800/60 text-marble-400/40"
            }`}
            onClick={() => setShowScoreTable(false)}
          >
            Enter Scores
          </button>
        </div>

        {/* ── SCORE TABLE VIEW ── */}
        {showScoreTable && (
          <motion.div
            ref={tableRef}
            className="score-panel p-4 mb-3 overflow-x-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-bold text-gold-300">
                Score Sheet
              </h2>
              <span className="text-[10px] font-bold text-gold-400 bg-gold-700/25 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Hand {scores.allHandScores.length}/24
              </span>
            </div>

            <table className="w-full text-xs font-body border-collapse">
              <thead>
                <tr>
                  <th className="py-2 text-left text-marble-500/40 font-bold text-[10px] w-8">
                    #
                  </th>
                  {playerNames.map((name, i) => (
                    <th
                      key={i}
                      className={`py-2 text-center font-semibold text-[11px] ${
                        i === leadingPlayer
                          ? "text-gold-400"
                          : "text-marble-300"
                      }`}
                    >
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {handSequence.map((hc, handIdx) => {
                  const isCompleted = handIdx < scores.allHandScores.length;
                  const isCurrent = handIdx === currentHand;
                  const hs = isCompleted
                    ? scores.allHandScores[handIdx]
                    : null;

                  return (
                    <tr
                      key={handIdx}
                      className={`cursor-pointer transition-colors ${
                        isCurrent
                          ? "bg-gold-600/20 border-l-2 border-l-gold-400"
                          : isCompleted
                            ? "hover:bg-white/5"
                            : ""
                      } ${
                        isSetBoundary(handIdx)
                          ? "border-t-2 border-t-gold-600/20"
                          : "border-t border-t-white/5"
                      }`}
                      onClick={() => {
                        setCurrentHand(handIdx);
                        setShowScoreTable(false);
                      }}
                    >
                      {/* Hand number */}
                      <td className="py-1.5 text-marble-500/30 font-mono text-[10px] pl-1">
                        {handIdx + 1}
                      </td>

                      {/* Player scores */}
                      {[0, 1, 2, 3].map((pIdx) => (
                        <td key={pIdx} className="py-1.5 text-center">
                          {isCompleted && hs ? (
                            <div>
                              <span className="text-marble-500/30 text-[8px]">
                                {hs[pIdx].bid}{" "}
                              </span>
                              <span
                                className={`font-mono font-bold ${
                                  hs[pIdx].isSuccess
                                    ? "text-gold-300"
                                    : hs[pIdx].isHistPenalty
                                      ? "text-error-500 font-black"
                                      : "text-error-500/70"
                                }`}
                              >
                                {hs[pIdx].score > 0 ? "+" : ""}
                                {hs[pIdx].score}
                              </span>
                            </div>
                          ) : isCurrent ? (
                            <span className="text-gold-400/60 text-[10px] italic">
                              {entries[handIdx]?.bids[pIdx] !== undefined
                                ? `bid: ${entries[handIdx].bids[pIdx]}`
                                : "..."}
                            </span>
                          ) : (
                            <span className="text-marble-500/15">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>

              {/* Totals footer */}
              <tfoot>
                <tr className="border-t-2 border-t-gold-600/30">
                  <td className="py-2.5 pl-1">
                    <span className="text-[9px] font-black text-gold-600 uppercase tracking-wider leading-tight block">
                      Total
                    </span>
                  </td>
                  {playerNames.map((name, i) => (
                    <td key={i} className="py-2.5 text-center">
                      <div className="text-[8px] text-marble-400/40 uppercase font-semibold">
                        {name}
                      </div>
                      <div
                        className={`font-display text-base font-bold ${
                          i === leadingPlayer
                            ? "text-gold-400"
                            : "text-marble-100"
                        }`}
                      >
                        {scores.cumulative[i]}
                      </div>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </motion.div>
        )}

        {/* ── ENTRY VIEW ── */}
        {!showScoreTable && (
          <motion.div
            key={currentHand}
            className="glass-panel p-5 mb-3"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-xl font-bold text-gold-300">
                  Hand {currentHand + 1}
                </h2>
                <p className="text-xs text-marble-400/40 mt-0.5">
                  {handConfig.cardsPerPlayer} cards &middot; Set{" "}
                  {handConfig.setNumber} &middot; Dealer:{" "}
                  {playerNames[currentHand % 4]}
                </p>
              </div>
              <button
                onClick={() => setShowScoreTable(true)}
                className="text-xs text-gold-400/60 hover:text-gold-400 font-bold uppercase tracking-wider"
              >
                View Table
              </button>
            </div>

            {!entry.completed ? (
              <>
                <div className="space-y-3">
                  {playerNames.map((name, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-navy-800/60 rounded-2xl p-3"
                    >
                      <div className="w-9 h-9 rounded-full bg-navy-700 flex items-center justify-center text-sm font-bold text-marble-300">
                        {name[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm text-marble-200 font-semibold flex-1 truncate">
                        {name}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="text-center">
                          <label className="block text-[10px] text-marble-400/40 uppercase tracking-wider mb-1">
                            Bid
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={handConfig.cardsPerPlayer}
                            value={entry.bids[i]}
                            onChange={(e) =>
                              updateEntry(
                                currentHand,
                                "bids",
                                i,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-14 px-2 py-2 bg-navy-700 rounded-lg text-marble-100 text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 border border-gold-400/10"
                          />
                        </div>
                        <div className="text-center">
                          <label className="block text-[10px] text-marble-400/40 uppercase tracking-wider mb-1">
                            Won
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={handConfig.cardsPerPlayer}
                            value={entry.tricks[i]}
                            onChange={(e) =>
                              updateEntry(
                                currentHand,
                                "tricks",
                                i,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-14 px-2 py-2 bg-navy-700 rounded-lg text-marble-100 text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 border border-gold-400/10"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="btn-gold w-full py-4 mt-5 text-sm"
                  onClick={() => submitHand(currentHand)}
                >
                  SUBMIT HAND {currentHand + 1}
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-success-500 font-bold text-sm uppercase tracking-wider mb-3">
                  Completed
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {scores.allHandScores[currentHand]?.map(
                    (hs: HandScore, i: number) => (
                      <div key={i} className="text-center">
                        <span className="text-xs text-marble-400/40 block mb-1">
                          {playerNames[i]}
                        </span>
                        <span
                          className={`font-mono font-bold text-lg ${
                            hs.isSuccess
                              ? "text-success-500"
                              : "text-error-500"
                          }`}
                        >
                          {hs.score > 0 ? "+" : ""}
                          {hs.score}
                        </span>
                      </div>
                    )
                  )}
                </div>
                <button
                  className="mt-4 text-xs text-gold-400/50 hover:text-gold-400 uppercase tracking-wider font-bold"
                  onClick={() => {
                    if (currentHand < 23) setCurrentHand(currentHand + 1);
                  }}
                >
                  Next Hand →
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Hand Progression Grid */}
        <div className="glass-panel p-3">
          <p className="text-[10px] text-marble-400/40 uppercase tracking-wider font-bold mb-2 text-center">
            Hand Progression
          </p>
          <div className="grid grid-cols-8 gap-1.5 justify-items-center">
            {handSequence.map((hc, i) => (
              <button
                key={i}
                className={`w-7 h-7 rounded-md text-[10px] font-mono font-bold transition-all flex items-center justify-center ${
                  i === currentHand
                    ? "bg-gold-400 text-navy-900 shadow-[0_0_10px_rgba(253,195,77,0.4)]"
                    : entries[i]?.completed
                      ? "bg-success-600 text-marble-100"
                      : "bg-navy-800/80 text-marble-400/30"
                } ${isSetBoundary(i) ? "ml-1" : ""}`}
                onClick={() => {
                  setCurrentHand(i);
                  setShowScoreTable(false);
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
