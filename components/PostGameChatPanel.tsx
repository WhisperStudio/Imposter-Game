"use client";

import React, { useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import type { Player } from "@/types/player";
import type { AvatarSkin, AvatarType } from "@/firebase/avatarPrefs";
import { PlayerAvatar } from "@/components/avatars/PlayerAvatar";
import AvatarSkinScope from "@/components/avatars/AvatarSkinScope";
import { submitPostGameChat } from "@/firebase/lobby";

type PostChatItem = {
  uid: string;
  text: string;
  at: number;
};

type Props = {
  inviteCode: string;
  myUid: string;
  players: Player[];
  log?: PostChatItem[];
};

export default function PostGameChatPanel({ inviteCode, myUid, players, log }: Props) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameByUid = useMemo(() => {
    const m = new Map<string, string>();
    players.forEach((p) => m.set(p.uid, p.name));
    return m;
  }, [players]);

  const items = Array.isArray(log) ? log : [];

  const avatarTypeByUid = useMemo(() => {
    const out: Record<string, AvatarType> = {};
    players.forEach((p) => {
      out[p.uid] = (p.avatarType as AvatarType | undefined) ?? "classicAstronaut";
    });
    return out;
  }, [players]);

  const skinByUid = useMemo(() => {
    const out: Record<string, AvatarSkin> = {};
    players.forEach((p) => {
      out[p.uid] = (p.skin as AvatarSkin | undefined) ?? "classic";
    });
    return out;
  }, [players]);

  const onSend = async () => {
    setError(null);
    if (!inviteCode) return;
    const text = input.trim();
    if (!text) return;

    try {
      setSending(true);
      await submitPostGameChat(inviteCode, myUid, text);
      setInput("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to send");
      setSending(false);
    }
  };

  return (
    <Wrap>
      <Header>
        <Title>POST GAME CHAT</Title>
        <Sub>Talk it out before the next round.</Sub>
      </Header>

      <Feed>
        {items.length === 0 ? (
          <Empty>Nothing yet…</Empty>
        ) : (
          items.map((m, idx) => {
            const isMe = m.uid === myUid;
            const msgSkin = skinByUid?.[m.uid] ?? "classic";
            const msgType = avatarTypeByUid?.[m.uid] ?? "classicAstronaut";
            return (
              <Msg key={`${m.at}-${idx}`} $me={isMe}>
                <AvatarCol>
                  <AvatarSkinScope skin={msgSkin}>
                    <PlayerAvatar type={msgType} size={38} />
                  </AvatarSkinScope>
                </AvatarCol>
                <MsgContent>
                  <Meta>
                    <Name>{(nameByUid.get(m.uid) ?? "Unknown").toUpperCase()}</Name>
                  </Meta>
                  <Body>{m.text}</Body>
                </MsgContent>
              </Msg>
            );
          })
        )}
      </Feed>

      <InputRow>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write a message…"
          disabled={sending}
          maxLength={220}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
        />
        <Btn onClick={onSend} disabled={sending || !input.trim()}>
          {sending ? "…" : "SEND"}
        </Btn>
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
  margin-top: 1.25rem;
  animation: ${fadeIn} 0.35s ease-out;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  overflow: hidden;
`;

const Header = styled.div`
  padding: 1rem 1rem 0.75rem;
`;

const Title = styled.div`
  color: #e2e8f0;
  font-weight: 900;
  letter-spacing: 2px;
  font-family: monospace;
`;

const Sub = styled.div`
  color: #94a3b8;
  margin-top: 0.35rem;
  font-size: 0.9rem;
`;

const Feed = styled.div`
  padding: 0.75rem 1rem;
  max-height: 260px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const Empty = styled.div`
  color: #64748b;
  text-align: center;
  padding: 1rem;
`;

const Msg = styled.div<{ $me: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border-radius: 12px;
  padding: 0.65rem 0.8rem;
  border: 1px solid ${({ $me }) => ($me ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.08)")};
  background: ${({ $me }) => ($me ? "rgba(16,185,129,0.08)" : "rgba(0,0,0,0.18)")};
`;

const AvatarCol = styled.div`
  width: 44px;
  display: grid;
  place-items: start center;
  flex: 0 0 auto;
`;

const MsgContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const Meta = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
`;

const Name = styled.div`
  font-size: 0.7rem;
  letter-spacing: 2px;
  color: #94a3b8;
  font-family: monospace;
`;

const Body = styled.div`
  color: #e2e8f0;
  font-size: 0.95rem;
  white-space: pre-wrap;
  word-break: break-word;
`;

const InputRow = styled.div`
  padding: 0.75rem 1rem 1rem;
  display: flex;
  gap: 0.75rem;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.25);
  color: #fff;
  outline: none;
`;

const Btn = styled.button`
  padding: 0.85rem 1.1rem;
  border-radius: 12px;
  border: none;
  background: #38bdf8;
  color: #0b1120;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorStrip = styled.div`
  padding: 0 1rem 1rem;
  color: #fca5a5;
  font-size: 0.85rem;
`;
