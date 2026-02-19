"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import styled, { keyframes } from "styled-components";
import Image from "next/image";
import { FaCog, FaTimes } from "react-icons/fa";
import ElectricAvatarPanel from "@/components/ElectricAvatarPanel";

import Lobby from "@/components/Lobby";
import Themes, { WORD_DATA } from "@/components/Themes";
import Game from "@/components/Game";
import OneDeviceGame from "@/components/OneDeviceGame";
import SettingsPanel from "@/components/settings";

import { PlayerAvatar } from "@/components/avatars/PlayerAvatar";
import AvatarSkinScope from "@/components/avatars/AvatarSkinScope";
import { Orbitron } from "next/font/google";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});


import type { Player } from "@/types/player";
import {
  createLobby,
  joinLobby,
  listenToLobby,
  listenToLobbyPlayersActiveSession, // ✅
  startGame,
  leaveLobby,
  closeLobby,
  updatePlayerPrefs,
  findReusableLobby,
  updatePlayerName,
} from "@/firebase/lobby";
import { useTheme } from "@/components/ThemeContext";

import { readSkin, readType, readElectricTheme, readName, type AvatarSkin, type AvatarType } from "@/firebase/avatarPrefs";
import type { ElectricTheme } from "@/firebase/avatarPrefs";


/* ---------------- helpers ---------------- */

function getOrCreateUid() {
  if (typeof window === "undefined") return crypto.randomUUID();
  const key = "imposter_uid";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const uid = crypto.randomUUID();
  localStorage.setItem(key, uid);
  return uid;
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mq.matches);

    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}


/* ---------------- background component ---------------- */
type StarT = {
  id: number;
  x: number;
  y: number;
  z: number;
  size: number;
  speed: number;
  delay: number;
  rot: number; // ✅
};

const StarryBackground = ({ 
  hyperspeed = false, 
  paused = false 
}: { 
  hyperspeed?: boolean;
  paused?: boolean;
}) => {
  const [stars, setStars] = useState<StarT[]>([]);

  useEffect(() => {
    const build = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      const next: StarT[] = Array.from({ length: 220 }, (_, i) => {
        const depth = Math.random();

        const x = (Math.random() - 0.5) * w * 1.6;
        const y = (Math.random() - 0.5) * h * 1.6;
        const rot = Math.atan2(y, x) * (180 / Math.PI);

        return {
          id: i,
          x,
          y,
          rot,
          z: -800 - depth * 1200,
          size: 1 + depth * 2.5,
          speed: 2 + depth * 4 + Math.random() * 2,
          delay: Math.random() * 3,
        };
      });

      setStars(next);
    };

    build();
    window.addEventListener("resize", build);
    return () => window.removeEventListener("resize", build);
  }, []);

  return (
    <StarBackground $hyperspeed={hyperspeed} $paused={paused}>
      {stars.map((s) => (
        <Star
          key={s.id}
          $x={s.x}
          $y={s.y}
          $z={s.z}
          $size={s.size}
          $speed={s.speed}
          $delay={s.delay}
          $rot={s.rot}          // ✅ VIKTIG
          $hyper={hyperspeed}   // ✅ VIKTIG
        />
      ))}
    </StarBackground>
  );
};

/* ---------------- page ---------------- */

export default function Home() {
  const uid = useMemo(() => getOrCreateUid(), []);
  useTheme();
  const [hyperspeed, setHyperspeed] = useState(false);

  const [showThemes, setShowThemes] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const [lobby, setLobby] = useState<any | null>(null);
  const isMobile = useIsMobile();

  const [lobbyPlayers, setLobbyPlayers] = useState<Player[]>([]);
const [myPlayer, setMyPlayer] = useState<Player | null>(null);


  const [isHost, setIsHost] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [oneDeviceMode, setOneDeviceMode] = useState(false);

  const handleExitLobby = useCallback(async () => {
    if (!inviteCode || !myPlayer) return;

    try {
      await leaveLobby(inviteCode, myPlayer.uid);
    } catch (e) {
      console.error(e);
    } finally {
      // reset state tilbake til startmeny
      setShowThemes(false);
      setInviteCode("");
      setLobby(null);
      setLobbyPlayers([]);
      setIsHost(false);
    }
  }, [inviteCode, myPlayer]);

  // prefs
  const [avatarType, setAvatarType] = useState<AvatarType>("classicAstronaut");
  const [skin, setSkin] = useState<AvatarSkin>("classic");
  const [electricTheme, setElectricTheme] = useState<ElectricTheme>("blue");

  useEffect(() => {
    setAvatarType(readType(uid));
    setSkin(readSkin(uid));
    setElectricTheme(readElectricTheme(uid));
  }, [uid]);
useEffect(() => {
  if (!inviteCode || !myPlayer?.uid) return;
  updatePlayerPrefs(inviteCode, myPlayer.uid, avatarType, skin).catch(console.error);
}, [inviteCode, myPlayer?.uid, avatarType, skin]);

  
useEffect(() => {
  const onPrefs = () => {
    setAvatarType(readType(uid));
    setSkin(readSkin(uid));
    setElectricTheme(readElectricTheme(uid));
  };

  onPrefs(); // ✅ init
  window.addEventListener("imposter:avatarPrefs", onPrefs);
  return () => window.removeEventListener("imposter:avatarPrefs", onPrefs);
}, [uid]);


  const copyToClipboard = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

const setupLobby = useCallback(
  
  async (isNewGame = false, forcedCode?: string) => {
    // ✅ alltid sørg for at player har korrekt uid
    let player: Player;

    const savedName = readName(uid);
  const fallbackName = `Player ${Math.floor(100 + Math.random() * 900)}`;
    if (!myPlayer || !myPlayer.uid) {
      player = {
  uid,
  playerId: 0,
  name: savedName || fallbackName,
  avatar: "astronaut",
  skin,
  avatarType,
  joinedAt: Date.now(),
};

      setMyPlayer(player);
    } else {
      // ✅ tving korrekt uid hvis den av en eller annen grunn er feil/blank
      player = { ...myPlayer, uid: myPlayer.uid || uid };
      if (player.uid !== myPlayer.uid) setMyPlayer(player);
    }

    if (isNewGame) {
  const host: Player = { ...player, uid, playerId: 100, joinedAt: Date.now() };
  setMyPlayer(host);

  const code = forcedCode!;
  const sessionId = await createLobby(code, host);


  setInviteCode(code);
  setIsHost(true);
  return;
}



    if (!isNewGame && forcedCode) {
  const joiner: Player = { ...player, uid, playerId: 0, joinedAt: Date.now() };
  await joinLobby(forcedCode, joiner);

  setMyPlayer(joiner);
  setInviteCode(forcedCode);
  setIsHost(false);
  return;
}

  },
  [uid, myPlayer, avatarType, skin]
);

const handleCreateGame = useCallback(async () => {
  if (isCreating) return;
  setIsCreating(true);

  try {
    let code: string | null = await findReusableLobby();

    if (!code) {
      // ❌ ingen ledig → lag ny
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      code = Array.from({ length: 6 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join("");
    }

    await setupLobby(true, code);
  } catch (e) {
    console.error(e);
  } finally {
    setIsCreating(false);
  }
}, [setupLobby, isCreating]);


  const handleJoinGame = useCallback(
    async (code: string) => {
      if (isCreating) return;
      setIsCreating(true);
      try {
        await setupLobby(false, code);
      } catch (err) {
        console.error(err);
      } finally {
        setIsCreating(false);
      }
    },
    [setupLobby, isCreating]
  );

 // listen players (session-safe)
useEffect(() => {
  if (!inviteCode) {
    setLobbyPlayers([]);
    return;
  }

  const unsub = listenToLobbyPlayersActiveSession(inviteCode, setLobbyPlayers);
  return () => unsub();
}, [inviteCode]);

useEffect(() => {
  if (!inviteCode || !myPlayer?.uid) return;

  const savedName = readName(uid);
  if (!savedName) return;

  // unngå spam dersom samme navn
  if (myPlayer?.name === savedName) return;

  updatePlayerName(inviteCode, myPlayer.uid, savedName).catch(console.error);

  // også oppdater local state så dock viser riktig direkte
  setMyPlayer((p) => (p ? { ...p, name: savedName } : p));
}, [inviteCode, myPlayer?.uid, uid, myPlayer?.name]);


  // listen lobby
 useEffect(() => {
  if (!inviteCode || typeof inviteCode !== "string" || !/^[A-Z0-9]{6}$/.test(inviteCode)) {
    setLobby(null);
    setLobbyPlayers([]);
    setIsHost(false);
    return;
  }

  const unsub = listenToLobby(inviteCode, (l) => {
    if (!l || l.status === "closed") {
      setShowThemes(false);
      setInviteCode("");
      setLobby(null);
      setLobbyPlayers([]);
      setIsHost(false);
      return;
    }

    setLobby(l);
  });

  return () => unsub();
}, [inviteCode]);


  useEffect(() => {
  if (!inviteCode) return;
  localStorage.setItem("imposter_last_lobby", inviteCode);
}, [inviteCode]);


  // merge + dedupe players
  const myUid = myPlayer?.uid;
  const mergedPlayers = [...(myPlayer ? [myPlayer] : []), ...lobbyPlayers] as Player[];
  const uniquePlayers = Array.from(new Map(mergedPlayers.map((p) => [p.uid, p])).values());

  const orderedPlayers = myUid
    ? [...uniquePlayers.filter((p) => p.uid === myUid), ...uniquePlayers.filter((p) => p.uid !== myUid)]
    : uniquePlayers;

  const isInGame = lobby?.status === "started" || lobby?.status === "finished";

  const gameData = lobby?.game;

  // ✅ start game: bruker temaet som ligger i lobby.settings
const handleStartGame = useCallback(async () => {
  if (!inviteCode || !myPlayer) return;

  const selectedThemeIds: string[] = Array.isArray(lobby?.settings?.selectedThemeIds)
    ? lobby.settings.selectedThemeIds
    : lobby?.settings?.selectedThemeId
      ? [lobby.settings.selectedThemeId]
      : [];

  const activeThemeIndex: number = typeof lobby?.settings?.activeThemeIndex === "number" ? lobby.settings.activeThemeIndex : 0;
  const themeId: string | null =
    lobby?.settings?.selectedThemeId ??
    selectedThemeIds[activeThemeIndex] ??
    selectedThemeIds[0] ??
    null;

  if (!themeId) {
    alert("Host must select a theme first!");
    return;
  }

  const words = WORD_DATA[themeId];
  if (!words?.length) {
    alert("No words found for theme: " + themeId);
    return;
  }

  const usedWordsByTheme: Record<string, string[]> =
    lobby?.settings?.usedWordsByTheme && typeof lobby.settings.usedWordsByTheme === "object" ? lobby.settings.usedWordsByTheme : {};
  const usedForTheme = Array.isArray(usedWordsByTheme?.[themeId]) ? usedWordsByTheme[themeId] : [];
  const remaining = words.filter((w) => !usedForTheme.includes(w));

  if (remaining.length === 0) {
    alert("No unused words left for theme: " + themeId);
    return;
  }

  const difficulty: string = typeof lobby?.settings?.difficulty === "string" ? lobby.settings.difficulty : "normal";
  const wordLen = (w: string) => (w ?? "").toString().replace(/\s+/g, "").length;
  const fitsDifficulty = (w: string) => {
    const n = wordLen(w);
    if (difficulty === "easy") return n <= 5;
    if (difficulty === "normal") return n >= 5 && n <= 7;
    if (difficulty === "hard") return n >= 7;
    if (difficulty === "ultimate") return n >= 8;
    return true;
  };

  const diffPool = remaining.filter(fitsDifficulty);
  const pickPool = diffPool.length > 0 ? diffPool : remaining;

  // ✅ Velg secret word (crew får dette) – men aldri gjenta
  const randomWord = pickPool[Math.floor(Math.random() * pickPool.length)];

  // ✅ Lag snilt imposter-hint:
  // - fortell temaet
  // - vis 3 eksempler (ekskluder secret word)
  // - vis lengde på ordet (hjelper litt uten å avsløre)
  const pool = words.filter((w) => w !== randomWord);
  const examples: string[] = [];
  while (examples.length < Math.min(3, pool.length)) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!examples.includes(pick)) examples.push(pick);
  }

  const imposterHint = `THEME: ${themeId}.  WORD LENGTH: ${randomWord.length}.`;
  const imposterHintEasy = `THEME: ${themeId}.  WORD LENGTH: ${randomWord.length}. EXAMPLES: ${examples.join(", ")}.`;
  const imposterHintHard = `THEME: ${themeId}.`;

  const finalHint =
    difficulty === "easy"
      ? imposterHintEasy
      : difficulty === "hard" || difficulty === "ultimate"
        ? imposterHintHard
        : imposterHint;
  // Fjernet Exampleword for mer vanskelighetsgrad: Example words: ${examples.join(", ")}.
  // ✅ Start game med hint
  await startGame(inviteCode, myPlayer.uid, randomWord, themeId, finalHint);
}, [inviteCode, myPlayer, lobby]);


  return (
    <>
      <StarryBackground hyperspeed={hyperspeed} />

      <PageContainer>
        <GlowEffect />

       {/* Top-right player container */}
<PlayerDock>
<ElectricAvatarPanel
  theme={electricTheme}
  mirror={isMobile}
  borderRadiusCss={isMobile ? "0 0 160px 160px" : "0 0 0 60px"}
  width={isMobile ? 300 : 300}
  height={isMobile ? 150 : 200}
  radius={isMobile ? 160 : 60}
  emberCount={120}
  speed={1.15}
  chaos={0.14}
  lineWidth={1.15}
>
    <PlayerContainerInner>
      <Bar>
        <PlayerWrapper>
          <AvatarSkinScope skin={skin}>
            <PlayerAvatar type={avatarType} size={isMobile ? 80 : 100} />
          </AvatarSkinScope>



          <PlayerName>
            {myPlayer ? `${myPlayer.name} (You)` : "You (not in lobby)"}{" "}
            {myPlayer?.playerId === 100 ? "👑" : ""}
          </PlayerName>
        </PlayerWrapper>
      </Bar>

      <Bar_2>
        <VoteBadge>
          <a href="https://vintrastudio.com/" target="_blank">
          <Image src="/Vote_V.png" alt="Vote V" width={50} height={50} priority />
          </a>
        </VoteBadge>

        <SettingsButton onClick={() => setShowSettings(true)} aria-label="Open settings">
          <FaCog />
        </SettingsButton>
      </Bar_2>
    </PlayerContainerInner>
  </ElectricAvatarPanel>
</PlayerDock>


        <MainContainer>
          {inviteCode && (
            <InviteCode>
              <CodeLabel>Invite Code</CodeLabel>
              <CodeDisplay onClick={copyToClipboard} title="Click to copy">
                {inviteCode}
                {isCopied && (
                  <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "#4ade80" }}>
                    Copied!
                  </span>
                )}
              </CodeDisplay>
            </InviteCode>
          )}

          {!inviteCode && (
            <TitleBlock>
              <TitleSub className={orbitron.className}>FIND THE</TitleSub>
              <Title data-text="IMPOSTER" className={orbitron.className}>
                IMPOSTER
                <TitleGlitch aria-hidden="true" className={orbitron.className}>IMPOSTER</TitleGlitch>
                <TitleGlitch2 aria-hidden="true" className={orbitron.className}>IMPOSTER</TitleGlitch2>
                <TitleShine />
              </Title>
              <TitleTagline>Social deduction at its finest</TitleTagline>
            </TitleBlock>
          )}


          {/* ✅ game view */}
          {oneDeviceMode ? (
  <OneDeviceGame onBack={() => setOneDeviceMode(false)} />
) : isInGame ? (
  <Game
    inviteCode={inviteCode}
    players={orderedPlayers}
    myUid={uid}
    game={gameData}
    isHost={isHost}
    hostUid={myPlayer?.uid ?? ""}
    lobbySettings={lobby?.settings ?? null}
  />
) : !inviteCode ? (
  // ✅ STARTMENY (Create/Join)
  <Lobby
    mode="menu"
    players={orderedPlayers}
    onJoinGame={handleJoinGame}
    onCreateGame={handleCreateGame}
    onHyperspeed={(v) => setHyperspeed(v)}
    onOneDevice={() => setOneDeviceMode(true)}
  />
) : showThemes ? (
  // ✅ THEMES
  <Themes
    onBack={() => setShowThemes(false)}
    onStartGame={handleStartGame}
    isHost={isHost}
    canStartGame={
      (Array.isArray(lobby?.settings?.selectedThemeIds) && lobby.settings.selectedThemeIds.length > 0) ||
      !!lobby?.settings?.selectedThemeId
    }
    inviteCode={inviteCode}
    hostUid={myPlayer?.uid ?? ""}
    initialSelectedThemeIds={
      Array.isArray(lobby?.settings?.selectedThemeIds)
        ? lobby.settings.selectedThemeIds
        : lobby?.settings?.selectedThemeId
          ? [lobby.settings.selectedThemeId]
          : []
    }
  />
) : (
  // ✅ LOBBY ROM (etter join/create)
  <Lobby
    mode="room"
    players={orderedPlayers}
    isHost={isHost}
    onContinueToThemes={() => setShowThemes(true)}
    onExitLobby={handleExitLobby}
    inviteCode={inviteCode}
    hostUid={myPlayer?.uid ?? ""}
    lobbySettings={lobby?.settings ?? null}
  />
)}

        </MainContainer>
      </PageContainer>

      {/* Settings Modal */}
      {showSettings && (
        <ModalOverlay onClick={() => setShowSettings(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <CloseBtn onClick={() => setShowSettings(false)} aria-label="Close settings">
              <FaTimes />
            </CloseBtn>

            <SettingsPanel
              uid={uid}
              initialAvatarType={avatarType}
              initialSkin={skin}
              onAvatarTypeChange={(t) => setAvatarType(t)}
              onSkinChange={(s) => setSkin(s)}
            />
          </ModalCard>
        </ModalOverlay>
      )}
    </>
  );
}

/* ---------------- styled components ---------------- */

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  width: 100vw;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  z-index: 2;
  box-sizing: border-box;
  overflow: hidden;
  @media (max-width: 768px) {
    padding: 0rem;
  }
`;

const StarBackground = styled.div<{ $hyperspeed?: boolean; $paused?: boolean }>`
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at center, #020617, #000);
  perspective: 800px;
  overflow: hidden;
  z-index: 0;

  ${({ $paused }) =>
    $paused &&
    `
      * {
        animation-play-state: paused !important;
      }
    `}

  ${({ $hyperspeed }) =>
    $hyperspeed &&
    `
      filter: brightness(1.08) contrast(1.05);
    `}
`;


const fly = keyframes`
  from {
    transform: translate3d(var(--x), var(--y), var(--z)) scale(var(--size));
    opacity: 0;
  }
  10% { opacity: 1; }
  to {
    transform: translate3d(
      calc(var(--x) * 1.6),
      calc(var(--y) * 1.6),
      300px
    ) scale(calc(var(--size) * 1.5));
    opacity: 0;
  }
`;

const flyHyper = keyframes`
  from {
    transform:
      translate3d(var(--x), var(--y), var(--z))
      rotate(var(--rot))
      scale(var(--size))
      scaleX(0.35);
    opacity: 0;
  }

  8% {
    opacity: 1;
  }

  to {
    transform:
      translate3d(
        calc(var(--x) * 2.2),
        calc(var(--y) * 2.2),
        650px
      )
      rotate(var(--rot))
      scale(var(--size))
      scaleX(22);
    opacity: 0;
  }
`;






const Star = styled.div<{
  $x: number;
  $y: number;
  $z: number;
  $size: number;
  $speed: number;
  $delay: number;
  $rot: number;
  $hyper?: boolean;
}>`
  position: absolute;
  left: 50%;
  top: 50%;

  width: 2px;
  height: 2px;
  border-radius: 999px;
  background: white;

  --x: ${({ $x }) => `${$x}px`};
  --y: ${({ $y }) => `${$y}px`};
  --z: ${({ $z }) => `${$z}px`};
  --size: ${({ $size }) => $size};
  --rot: ${({ $rot }) => `${$rot}deg`}; /* ✅ MUST */

  transform-origin: center;
  will-change: transform, opacity;

  animation: ${({ $hyper }) => ($hyper ? flyHyper : fly)}
    ${({ $hyper, $speed }) => ($hyper ? Math.max(0.35, $speed * 0.18) : $speed)}s
    linear infinite;

  animation-delay: ${({ $delay }) => $delay}s;
`;

const glitchAnim1 = keyframes`
  0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); }
  5% { clip-path: inset(20% 0 60% 0); transform: translate(-4px, 2px); }
  10% { clip-path: inset(0 0 0 0); transform: translate(0); }
  15% { clip-path: inset(70% 0 5% 0); transform: translate(3px, -1px); }
  20% { clip-path: inset(0 0 0 0); transform: translate(0); }
`;

const glitchAnim2 = keyframes`
  0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); }
  5% { clip-path: inset(50% 0 20% 0); transform: translate(4px, -2px); }
  10% { clip-path: inset(0 0 0 0); transform: translate(0); }
  15% { clip-path: inset(10% 0 75% 0); transform: translate(-3px, 1px); }
  20% { clip-path: inset(0 0 0 0); transform: translate(0); }
`;

const bloodPulse = keyframes`
  0%, 100% {
    text-shadow:
      0 0 7px rgba(255, 45, 85, 0.4),
      0 0 20px rgba(255, 45, 85, 0.2),
      0 0 42px rgba(220, 38, 38, 0.15),
      0 4px 12px rgba(0, 0, 0, 0.9);
  }
  50% {
    text-shadow:
      0 0 10px rgba(255, 45, 85, 0.6),
      0 0 30px rgba(255, 45, 85, 0.35),
      0 0 60px rgba(220, 38, 38, 0.25),
      0 4px 12px rgba(0, 0, 0, 0.9);
  }
`;

const shineSweep = keyframes`
  0%   { transform: translateX(-150%) skewX(-20deg); opacity: 0; }
  15%  { opacity: 0; }
  50%  { opacity: 0.25; }
  85%  { opacity: 0; }
  100% { transform: translateX(150%) skewX(-20deg); opacity: 0; }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  margin-bottom: 2rem;
  animation: ${fadeInUp} 0.8s ease-out;
`;

const TitleSub = styled.div`
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.5em;
  color: rgba(148, 163, 184, 0.7);
  text-transform: uppercase;
  margin-bottom: 0.25rem;

  @media (max-width: 768px) {
    font-size: 0.75rem;
    letter-spacing: 0.4em;
  }
`;

const Title = styled.h1`
  position: relative;
  text-align: center;
  margin: 0;
  font-size: clamp(3.5rem, 10vw, 6.5rem);
  font-weight: 900;
  letter-spacing: 0.06em;
  line-height: 1;
  color: transparent;
  background: linear-gradient(180deg, #ff2d55 0%, #dc2626 50%, #991b1b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${bloodPulse} 3.8s ease-in-out infinite;
  -webkit-text-stroke: 1px rgba(255, 45, 85, 0.3);
`;

const TitleGlitch = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #ff2d55 0%, #dc2626 50%, #991b1b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${glitchAnim1} 4s infinite;
  opacity: 0.6;
`;

const TitleGlitch2 = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #3b82f6 0%, #6366f1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${glitchAnim2} 4s infinite 0.05s;
  opacity: 0.3;
`;

const TitleShine = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 45%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0.15) 55%,
    transparent 100%
  );
  animation: ${shineSweep} 6s ease-in-out infinite;
  pointer-events: none;
`;

const TitleTagline = styled.div`
  font-size: 0.9rem;
  color: rgba(148, 163, 184, 0.5);
  letter-spacing: 0.15em;
  margin-top: 0.75rem;
  font-style: italic;

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const TitleTagline = styled.div`
  font-size: 0.9rem;
  color: rgba(148, 163, 184, 0.5);
  letter-spacing: 0.15em;
  margin-top: 0.75rem;
  font-style: italic;

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const GlowEffect = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, rgba(16, 24, 39, 0) 70%);
  pointer-events: none;
  z-index: 1;
`;

const MainContainer = styled.main`
  width: 100%;
  max-width: 1200px;
  position: relative;
  z-index: 2;
  overflow: visible;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PlayerDock = styled.div`
  position: absolute;
  top: -4px;
  right: -1px;
  width: 300px;
  height: 200px;
  z-index: 10;
  @media (max-width: 768px) {
    right: auto;
    left:auto;
    height: 150px;
    width: 300px;
  }
`;

const PlayerContainerInner = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 100%;
  height: 100%;
  gap: 3rem;

  /* behold samme look */
  background: #1e293b;
  border-radius: 0 0 0 60px;
  padding: 1rem;

  /* ❌ fjern hvit border – electric tar over */
  border: none;
  @media (max-width: 768px) {
    gap: 0rem;
    width: 300px;
    height: 150px;
    align-items: center;
    border-radius: 0 0  160px 160px;
  }
`;


const Bar = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
`;

const Bar_2 = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
  justify-content: center;
`;

const PlayerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  border-radius: 12px;
  min-width: 120px;
`;
const PlayerInner = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 100%;
  height: 100%;
  gap: 3rem;
  padding: 1rem;
  z-index: 10;
`;

const PlayerName = styled.div`
  color: #94a3b8;
`;

const VoteBadge = styled.div`
  z-index: 10;
  img {
    width: 60px;
    height: 60px;
    object-fit: contain;
  }
  @media (max-width: 768px) {
    display: none;
    visibility: hidden;
  }
`;
const SettingsButton = styled.button`
  display: flex;
  width: 60px;
  height: 60px;
  border: 2px solid #4f46e5;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  background: #1e293b;
  color: #e5e7eb;
  font-size: 1.5rem;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: scale(1.1) rotate(360deg);
    box-shadow: 0 0 15px rgba(99, 102, 241, 0.5);
    transition: transform 0.5s ease-in-out, box-shadow 0.3s ease;
  }
  @media (max-width: 768px) {
    position: fixed;
    bottom: 10px;
    right: 10px;
  }
`;

const InviteCode = styled.div`
  margin-bottom: 2rem;
  text-align: center;
  color: #e5e7eb;
  @media (max-width: 768px) {
    margin-top:1.5rem;
    margin-bottom: 0rem;
  }
`;

const CodeDisplay = styled.div`
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-family: monospace;
  font-size: 1.25rem;
  letter-spacing: 0.2em;
  margin-top: 0.5rem;
  border: 1px solid #4f46e5;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(79, 70, 229, 0.2);
    transform: translateY(-2px);
  }
`;

const CodeLabel = styled.div`
  font-size: 0.875rem;
  color: #94a3b8;
  margin-bottom: 0.25rem;
  
`;

const ViewContainer = styled.div<{ $isActive: boolean }>`
  width: 100%;
  transition: opacity 0.3s ease, transform 0.3s ease;
  position: ${({ $isActive }) => ($isActive ? "relative" : "absolute")};
  opacity: ${({ $isActive }) => ($isActive ? 1 : 0)};
  pointer-events: ${({ $isActive }) => ($isActive ? "auto" : "none")};
  transform: ${({ $isActive }) => ($isActive ? "translateY(0)" : "translateY(20px)")};
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(2, 6, 23, 0.72);
  backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  padding: 1rem;
  ::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.4);
  border-radius: 10px;
  margin: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #475569 0%, #334155 100%);
  border-radius: 10px;
  border: 2px solid rgba(15, 23, 42, 0.4);
  transition: background 0.2s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #64748b 0%, #475569 100%);
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.3);
  pointer-events: none;
}

::-webkit-scrollbar-thumb:active {
  background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
}

/* Custom Scrollbar - Horizontal */
::-webkit-scrollbar:horizontal {
  height: 12px;
}

::-webkit-scrollbar-track:horizontal {
  background: rgba(15, 23, 42, 0.4);
  border-radius: 10px;
  margin: 4px;
}

::-webkit-scrollbar-thumb:horizontal {
  background: linear-gradient(90deg, #475569 0%, #334155 100%);
  border-radius: 10px;
  border: 2px solid rgba(15, 23, 42, 0.4);
}

::-webkit-scrollbar-thumb:horizontal:hover {
  background: linear-gradient(90deg, #64748b 0%, #475569 100%);
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.3);
  pointer-events: pointer;
}

`;

const ModalCard = styled.div`
  width: min(980px, 95vw);
  max-height: 90vh;
  overflow: auto;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 80px rgba(0, 0, 0, 0.5);
  position: relative;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(30, 41, 59, 0.65);
  color: #e2e8f0;
  display: grid;
  place-items: center;
  cursor: pointer;

  &:hover {
    background: rgba(30, 41, 59, 0.9);
  }
`;

