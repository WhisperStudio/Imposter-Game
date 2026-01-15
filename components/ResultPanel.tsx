"use client";

import React, { useMemo, useState } from "react";
import styled from "styled-components";
import type { Player } from "@/types/player";
import { resetGame } from "@/firebase/lobby";

type Props = {
  inviteCode: string;
  players: Player[];
  imposterUid: string;
  result: { winner: "crew" | "imposter"; loser?: "crew" | "imposter"; eliminatedUid: string };
  isHost: boolean;
  hostUid: string;
};

export default function ResultPanel({ inviteCode, players, imposterUid, result, isHost, hostUid }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const nameByUid = useMemo(() => {
    const m = new Map<string, string>();
    players.forEach((p) => m.set(p.uid, p.name));
    return m;
  }, [players]);

  const imposterName = nameByUid.get(imposterUid) ?? "Unknown";
  const eliminatedName = nameByUid.get(result.eliminatedUid) ?? "Unknown";

  const winnerLabel = result.winner === "crew" ? "CREW" : "IMPOSTER";
  const loserRole = result.loser ?? (result.winner === "crew" ? "imposter" : "crew");
  const loserLabel = loserRole === "crew" ? "CREW" : "IMPOSTER";

  const handlePlayAgain = async () => {
    setError(null);
    try {
      setResetting(true);
      await resetGame(inviteCode, hostUid);
    } catch (e: any) {
      setError(e?.message ?? "Failed to reset");
    } finally {
      setResetting(false);
    }
  };

  return (
    <Wrap>
      <Title>Game Over</Title>

      <Winner $winner={result.winner}>
        Winner: <b>{winnerLabel}</b>
      </Winner>

      {/* ✅ Under winner: loser */}
      <Loser $loser={loserRole}>
        Loser: <b>{loserLabel}</b>
      </Loser>

      <Box>
        <Row>
          <Label>Imposter was:</Label>
          <Value>{imposterName}</Value>
        </Row>
        <Row>
          <Label>Eliminated:</Label>
          <Value>{eliminatedName}</Value>
        </Row>
      </Box>

      <Actions>
        {isHost ? (
          <Btn onClick={handlePlayAgain} disabled={resetting}>
            {resetting ? "Resetting..." : "Play Again"}
          </Btn>
        ) : (
          <Muted>Waiting for host to start a new round…</Muted>
        )}
      </Actions>

      {error && <ErrorBox>{error}</ErrorBox>}
    </Wrap>
  );
}

const Wrap = styled.div`
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 1.25rem;
  text-align: center;
`;

const Title = styled.div`
  font-size: 1.5rem;
  font-weight: 1000;
  color: #e2e8f0;
  margin-bottom: 0.75rem;
`;

const Winner = styled.div<{ $winner: "crew" | "imposter" }>`
  padding: 0.9rem;
  border-radius: 14px;
  font-weight: 900;
  margin-bottom: 0.75rem;
  color: ${({ $winner }) => ($winner === "crew" ? "#86efac" : "#fca5a5")};
  background: ${({ $winner }) => ($winner === "crew" ? "rgba(34, 197, 94, 0.10)" : "rgba(239, 68, 68, 0.10)")};
  border: 1px solid ${({ $winner }) => ($winner === "crew" ? "rgba(34, 197, 94, 0.18)" : "rgba(239, 68, 68, 0.18)")};
`;

const Loser = styled.div<{ $loser: "crew" | "imposter" }>`
  padding: 0.75rem;
  border-radius: 14px;
  font-weight: 900;
  margin-bottom: 1rem;
  color: ${({ $loser }) => ($loser === "crew" ? "#86efac" : "#fca5a5")};
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
`;

const Box = styled.div`
  background: rgba(2, 6, 23, 0.45);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 1rem;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
`;

const Label = styled.div`
  color: #94a3b8;
`;

const Value = styled.div`
  font-weight: 900;
  color: #e2e8f0;
`;

const Actions = styled.div`
  margin-top: 1rem;
  display: flex;
  justify-content: center;
`;

const Btn = styled.button`
  padding: 0.9rem 1.4rem;
  border-radius: 14px;
  border: none;
  background: #4f46e5;
  color: #fff;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Muted = styled.div`
  color: #94a3b8;
  font-style: italic;
`;

const ErrorBox = styled.div`
  margin-top: 0.75rem;
  color: #fecaca;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 0.75rem;
  border-radius: 12px;
`;
