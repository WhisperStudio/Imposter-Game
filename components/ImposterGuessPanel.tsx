"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import type { Player } from "@/types/player";
import { setImposterGuessTyping, submitImposterGuess } from "@/firebase/lobby";

type ImposterGuessState = {
  uid: string;
  text: string;
  submitted?: boolean;
  finalGuess?: string | null;
  correct?: boolean | null;
  startedAt?: number;
  updatedAt?: number;
} | null;

type Props = {
  inviteCode: string;
  myUid: string;
  players: Player[];
  imposterUid: string;
  eliminatedUid: string;
  imposterGuess: ImposterGuessState;
};

export default function ImposterGuessPanel({
  inviteCode,
  myUid,
  players,
  imposterUid,
  eliminatedUid,
  imposterGuess,
}: Props) {
  const [localText, setLocalText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isImposter = myUid === imposterUid;
  const isActive = eliminatedUid === imposterUid;

  const nameByUid = useMemo(() => {
    const m = new Map<string, string>();
    players.forEach((p) => m.set(p.uid, p.name));
    return m;
  }, [players]);

  const imposterName = nameByUid.get(imposterUid) ?? "Imposter";

  useEffect(() => {
    if (!isImposter) return;
    setLocalText(imposterGuess?.text ?? "");
  }, [isImposter, imposterGuess?.text]);

  const debounceRef = useRef<any>(null);
  const onChange = (v: string) => {
    setLocalText(v);
    setError(null);
    if (!isImposter) return;
    if (!inviteCode) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setImposterGuessTyping(inviteCode, myUid, v).catch(() => {});
    }, 80);
  };

  const onSubmit = async () => {
    setError(null);
    if (!isImposter) return;
    if (!inviteCode) return;

    try {
      setSending(true);
      await submitImposterGuess(inviteCode, myUid, localText);
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit");
      setSending(false);
    }
  };

  if (!isActive) {
    return (
      <Wrap>
        <Title>IMPOSTER GUESS</Title>
        <Sub>Waiting...</Sub>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <Title>IMPOSTER GUESS</Title>
      <Sub>
        {imposterName} was voted out.
        {" "}
        {isImposter ? "You may now guess the secret word." : "They may now guess the secret word."}
      </Sub>

      <LiveBox>
        <LiveLabel>LIVE INPUT</LiveLabel>
        <LiveValue>{(imposterGuess?.text ?? "").toString() || "…"}</LiveValue>
      </LiveBox>

      <InputRow>
        <GuessInput
          value={isImposter ? localText : (imposterGuess?.text ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isImposter ? "Type your guess" : "Imposter is typing…"}
          disabled={!isImposter || !!imposterGuess?.submitted || sending}
          maxLength={64}
        />
        <SubmitBtn
          onClick={onSubmit}
          disabled={!isImposter || !!imposterGuess?.submitted || sending || !localText.trim()}
        >
          {sending ? "SENDING…" : "SUBMIT"}
        </SubmitBtn>
      </InputRow>

      {error && <ErrorStrip>{error}</ErrorStrip>}
    </Wrap>
  );
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Wrap = styled.div`
  width: 100%;
  animation: ${fadeIn} 0.35s ease-out;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 1.25rem;
`;

const Title = styled.div`
  font-family: monospace;
  letter-spacing: 3px;
  color: #fca5a5;
  font-weight: 900;
  margin-bottom: 0.5rem;
`;

const Sub = styled.div`
  color: #94a3b8;
  margin-bottom: 1rem;
`;

const LiveBox = styled.div`
  border-radius: 12px;
  border: 1px solid rgba(239,68,68,0.25);
  background: rgba(239,68,68,0.08);
  padding: 0.9rem;
  margin-bottom: 1rem;
`;

const LiveLabel = styled.div`
  font-size: 0.7rem;
  letter-spacing: 2px;
  color: rgba(252,165,165,0.9);
  margin-bottom: 0.4rem;
`;

const LiveValue = styled.div`
  font-size: 1.35rem;
  font-weight: 900;
  color: #fff;
  word-break: break-word;
`;

const InputRow = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`;

const GuessInput = styled.input`
  flex: 1;
  padding: 0.9rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.25);
  color: #fff;
  outline: none;
`;

const SubmitBtn = styled.button`
  padding: 0.9rem 1.1rem;
  border-radius: 12px;
  border: none;
  background: #ef4444;
  color: #0b1120;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorStrip = styled.div`
  margin-top: 0.75rem;
  color: #fca5a5;
  font-size: 0.85rem;
`;
