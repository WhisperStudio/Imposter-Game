"use client";

import styled from "styled-components";
import { FaArrowRight, FaUserPlus, FaGamepad, FaSignOutAlt, FaMobileAlt } from "react-icons/fa";
import { useState, useEffect, useMemo } from "react";
import type { Player } from "@/types/player";

import { updateLobbySettings } from "@/firebase/lobby";


import { PlayerAvatar } from "@/components/avatars/PlayerAvatar";
import AvatarSkinScope from "@/components/avatars/AvatarSkinScope";



import { readSkin, readType, type AvatarSkin, type AvatarType } from "@/firebase/avatarPrefs";

/* ---------------- helpers ---------------- */
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


function getOrCreateUid() {
  if (typeof window === "undefined") return "";
  const key = "imposter_uid";
  let uid = localStorage.getItem(key);
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem(key, uid);
  }
  return uid;
}

type LobbyMode = "menu" | "room";

type Difficulty = "easy" | "normal" | "hard" | "ultimate";

interface LobbyProps {
  mode?: LobbyMode;

  // menu actions
  onJoinGame?: (code: string) => void;
  onCreateGame?: () => void;
  onOneDevice?: () => void;

  // room actions
  onContinueToThemes?: () => void;
  onExitLobby?: () => void;
  onHyperspeed?: (active: boolean) => void;
  // shared
  players: Player[];
  isHost?: boolean;

  inviteCode?: string;
  hostUid?: string;
  lobbySettings?: any;
}

/* ---------------- component ---------------- */

export default function Lobby({
  mode = "menu",
  players,
  onJoinGame,
  onCreateGame,
  onOneDevice,
  onContinueToThemes,
  onExitLobby,
  onHyperspeed,
  isHost = false,
  inviteCode: activeInviteCode,
  hostUid,
  lobbySettings,
}: LobbyProps) {
  const uid = useMemo(() => getOrCreateUid(), []);

  const [inviteCode, setInviteCode] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);
  const isMobile = useIsMobile();
  // prefs
  const [avatarType, setAvatarType] = useState<AvatarType>("classicAstronaut");
  const [skin, setSkin] = useState<AvatarSkin>("classic");

  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(30);

  useEffect(() => {
    const d: Difficulty =
      lobbySettings?.difficulty === "easy" ||
      lobbySettings?.difficulty === "normal" ||
      lobbySettings?.difficulty === "hard" ||
      lobbySettings?.difficulty === "ultimate"
        ? lobbySettings.difficulty
        : "normal";
    setDifficulty(d);

    const perTurn = typeof lobbySettings?.perTurnTimerSeconds === "number" ? lobbySettings.perTurnTimerSeconds : null;
    setTimerEnabled(typeof perTurn === "number" && perTurn > 0);
    if (typeof perTurn === "number" && perTurn > 0) setTimerSeconds(perTurn);
  }, [lobbySettings]);

  // Toggle hyperspeed effect
  const toggleHyperspeed = (active: boolean, source: string) => {
    console.log(`[Hyperspeed] ${active ? 'ON' : 'OFF'} - ${source}`);
    onHyperspeed?.(active);
  };

  // Handle mouse enter for buttons
  const handleMouseEnter = () => {
    if (mode === 'menu' && !showJoinForm) {
      toggleHyperspeed(true, 'button hover');
    }
  };

  // Handle mouse leave for buttons
  const handleMouseLeave = () => {
    if (mode === 'menu' && !showJoinForm) {
      toggleHyperspeed(false, 'button leave');
    }
  };

  useEffect(() => {
    if (!uid) return;
    setAvatarType(readType(uid));
    setSkin(readSkin(uid));
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const onPrefs = () => {
      setAvatarType(readType(uid));
      setSkin(readSkin(uid));
    };
    window.addEventListener("imposter:avatarPrefs", onPrefs);
    return () => window.removeEventListener("imposter:avatarPrefs", onPrefs);
  }, [uid]);

  useEffect(() => {
    if (mode !== "menu") {
      // Ensure hyperspeed is off when not in menu mode
      toggleHyperspeed(false, 'mode changed');
      return;
    }
    
    // Toggle hyperspeed based on join form visibility
    toggleHyperspeed(showJoinForm, 'join form visibility');
    
    // Cleanup function to ensure hyperspeed is turned off when component unmounts
    return () => {
      toggleHyperspeed(false, 'component unmount');
    };
  }, [mode, showJoinForm]);



  const handleJoinGame = async () => {
  if (!inviteCode.trim() || !onJoinGame) return;

  // slå av FØR du bytter view / state
  onHyperspeed?.(false);

  onJoinGame(inviteCode.trim().toUpperCase());
  setShowJoinForm(false);
};

  const applySettings = async (next: { difficulty?: Difficulty; perTurnTimerSeconds?: number | null }) => {
    if (!isHost) return;
    if (!activeInviteCode || !hostUid) return;

    try {
      await updateLobbySettings(activeInviteCode, hostUid, next);
    } catch (e) {
      console.error(e);
    }
  };

  const onChangeDifficulty = async (v: Difficulty) => {
    setDifficulty(v);
    await applySettings({ difficulty: v });
  };

  const onToggleTimer = async (enabled: boolean) => {
    setTimerEnabled(enabled);
    await applySettings({ perTurnTimerSeconds: enabled ? timerSeconds : null });
  };

  const onChangeTimerSeconds = async (v: number) => {
    const next = Number.isFinite(v) ? Math.max(5, Math.min(300, Math.floor(v))) : 30;
    setTimerSeconds(next);
    if (!timerEnabled) return;
    await applySettings({ perTurnTimerSeconds: next });
  };

  return (
    <LobbyContainer>
      {mode === "room" && (
        <LobbyTitle>Lobby</LobbyTitle>
      )}

      {/* PLAYERS always visible in room mode, optional in menu mode */}
      {mode === "room" && (
        <PlayersGrid>
          {players.map((player) => {
  const effectiveSkin = player.uid === uid ? skin : (player.skin ?? "classic");
  const effectiveType = player.uid === uid ? avatarType : (player.avatarType ?? "classicAstronaut");

  return (
    <PlayerCard key={player.uid}>
      <AvatarSkinScope skin={effectiveSkin as any}>
        <PlayerAvatar type={effectiveType as any} size={isMobile ? 50 : 80} />
      </AvatarSkinScope>

      <PlayerName className={player.playerId === 100 ? "host" : ""}>
        {player.name}
        {player.playerId === 100 && " (Host)"}
      </PlayerName>
    </PlayerCard>
  );
})}

        </PlayersGrid>
      )}

      {/* MENU MODE */}
      {mode === "menu" && (
        <GameControls>
          {!showJoinForm ? (
            <>
              <MenuButtonLarge
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseDown={() => toggleHyperspeed(false, 'create game mousedown')}
                onClick={() => {
                  toggleHyperspeed(false, 'create game click');
                  onCreateGame?.();
                }}
                $variant="primary"
              >
                <MenuBtnIcon><FaGamepad /></MenuBtnIcon>
                <MenuBtnContent>
                  <MenuBtnTitle>Create Game</MenuBtnTitle>
                  <MenuBtnDesc>Start a new lobby and invite friends</MenuBtnDesc>
                </MenuBtnContent>
                <MenuBtnArrow><FaArrowRight /></MenuBtnArrow>
              </MenuButtonLarge>

              <MenuButtonLarge
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseDown={() => toggleHyperspeed(false, 'join game mousedown')}
                onClick={() => {
                  toggleHyperspeed(false, 'join game click');
                  setShowJoinForm(true);
                }}
                $variant="secondary"
              >
                <MenuBtnIcon><FaUserPlus /></MenuBtnIcon>
                <MenuBtnContent>
                  <MenuBtnTitle>Join Game</MenuBtnTitle>
                  <MenuBtnDesc>Enter an invite code to join</MenuBtnDesc>
                </MenuBtnContent>
                <MenuBtnArrow><FaArrowRight /></MenuBtnArrow>
              </MenuButtonLarge>

              <MenuDivider>
                <MenuDividerLine />
                <MenuDividerText>OR PLAY LOCALLY</MenuDividerText>
                <MenuDividerLine />
              </MenuDivider>

              <MenuButtonLarge
                onClick={() => {
                  toggleHyperspeed(false, 'one device click');
                  onOneDevice?.();
                }}
                $variant="secondary"
              >
                <MenuBtnIcon style={{ color: "#3b82f6" }}><FaMobileAlt /></MenuBtnIcon>
                <MenuBtnContent>
                  <MenuBtnTitle>One Device</MenuBtnTitle>
                  <MenuBtnDesc>Pass the phone and play together</MenuBtnDesc>
                </MenuBtnContent>
                <MenuBtnArrow><FaArrowRight /></MenuBtnArrow>
              </MenuButtonLarge>
            </>
          ) : (
            <JoinFormCard>
              <JoinFormTitle>Enter Invite Code</JoinFormTitle>
              <JoinFormSub>Ask your host for the 6-character code</JoinFormSub>
              <CodeInputRow>
                {Array.from({ length: 6 }).map((_, i) => (
                  <CodeChar key={i} $filled={!!inviteCode[i]}>
                    {inviteCode[i] || ""}
                  </CodeChar>
                ))}
              </CodeInputRow>
              <HiddenCodeInput
                type="text"
                autoFocus
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                maxLength={6}
              />
              <JoinFormActions>
                <Button
                  onClick={handleJoinGame}
                  $variant="primary"
                  disabled={inviteCode.trim().length < 6}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Join Lobby
                </Button>
                <Button
                  onClick={() => { setShowJoinForm(false); setInviteCode(""); }}
                  $variant="secondary"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Back
                </Button>
              </JoinFormActions>
            </JoinFormCard>
          )}
        </GameControls>
      )}

      {/* ROOM MODE CONTROLS */}
      {mode === "room" && (
        <>
          <RoundSettingsCard>
            <RoundSettingsTitle>Round Settings</RoundSettingsTitle>

            <Row>
              <RowLabel>Difficulty</RowLabel>
              <Select
                value={difficulty}
                onChange={(e) => onChangeDifficulty(e.target.value as Difficulty)}
                disabled={!isHost}
              >
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
                <option value="ultimate">Ultimate</option>
              </Select>
            </Row>

            <Row>
              <RowLabel>Turn Timer</RowLabel>
              <TimerRow>
                <input
                  type="checkbox"
                  checked={timerEnabled}
                  onChange={(e) => onToggleTimer(e.target.checked)}
                  disabled={!isHost}
                />
                <TimerInput
                  type="number"
                  min={5}
                  max={300}
                  value={timerSeconds}
                  onChange={(e) => onChangeTimerSeconds(parseInt(e.target.value || "0", 10))}
                  disabled={!isHost || !timerEnabled}
                />
                <TimerSuffix>sec</TimerSuffix>
              </TimerRow>
            </Row>
          </RoundSettingsCard>

          <RoomActions>
          <Button
            onClick={() => onExitLobby?.()}
            $variant="secondary"
            style={{ justifyContent: "center" }}
    
          >
            <FaSignOutAlt style={{ rotate: "180deg" }} /> Exit Lobby
          </Button>

          {isHost && (
            <Button
              onClick={() => onContinueToThemes?.()}
              $variant="primary"
              style={{ justifyContent: "center" }}
              disabled={players.length < 1}
         
            >
              Pick Themes <FaArrowRight />
            </Button>
          )}
          </RoomActions>
        </>
      )}
    </LobbyContainer>
  );
}

/* ---------------- styled ---------------- */

const LobbyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const LobbyTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 800;
  color: #e2e8f0;
  text-align: center;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
`;

const PlayersGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4rem;
  width: 100%;
  margin: 0.5rem 0 0.75rem;
  border-bottom: 2px solid #a5a5a5;
  padding-bottom: 1rem;
  @media (max-width: 768px) {
    gap: 2rem;
  }
`;

const PlayerCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  
  border-radius: 12px;
  transition: all 0.3s ease;
  min-width: fit-content;

  &:hover {
    transform: translateY(-5px);
  }
  
`;

const PlayerName = styled.div`
  font-size: 1.1rem;
  color: #e2e8f0;
  text-align: center;
  font-weight: 500;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.host {
    color: #818cf8;
    font-weight: 600;
  }
  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  padding: 0.75rem 1.65rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
  background: ${({ $variant }) => ($variant === "primary" ? "#4f46e5" : "#374151")};
  color: white;

  &:hover {
    opacity: 0.92;
    transform: translateY(-2px);
    & > svg {
      transform: translateX(4px);
      transition: transform 0.2s ease-out;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const Input = styled.input`
  padding: 0.85rem 1.25rem;
  border: 1px solid #4b5563;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 1rem;
  width: 100%;
  max-width: 300px;

  &:focus {
    outline: none;
    border-color: #4f46e5;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const GameControls = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 480px;
  margin-top: 0.5rem;
`;

const MenuButtonLarge = styled.button<{ $variant?: "primary" | "secondary" }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid ${({ $variant }) =>
    $variant === "primary" ? "rgba(255, 45, 85, 0.3)" : "rgba(255, 255, 255, 0.1)"};
  border-radius: 16px;
  background: ${({ $variant }) =>
    $variant === "primary"
      ? "linear-gradient(135deg, rgba(255, 45, 85, 0.12) 0%, rgba(220, 38, 38, 0.08) 100%)"
      : "rgba(15, 23, 42, 0.6)"};
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: left;
  backdrop-filter: blur(12px);

  &:hover {
    transform: translateY(-3px);
    border-color: ${({ $variant }) =>
      $variant === "primary" ? "rgba(255, 45, 85, 0.6)" : "rgba(255, 255, 255, 0.2)"};
    box-shadow: ${({ $variant }) =>
      $variant === "primary"
        ? "0 8px 32px rgba(255, 45, 85, 0.15), 0 0 0 1px rgba(255, 45, 85, 0.1)"
        : "0 8px 32px rgba(0, 0, 0, 0.3)"};
    background: ${({ $variant }) =>
      $variant === "primary"
        ? "linear-gradient(135deg, rgba(255, 45, 85, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)"
        : "rgba(30, 41, 59, 0.6)"};
  }

  &:hover svg:last-child {
    transform: translateX(4px);
  }
`;

const MenuBtnIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #ff2d55;
  flex-shrink: 0;
`;

const MenuBtnContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const MenuBtnTitle = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: #e2e8f0;
`;

const MenuBtnDesc = styled.div`
  font-size: 0.8rem;
  color: #64748b;
`;

const MenuBtnArrow = styled.div`
  font-size: 0.9rem;
  color: #64748b;
  transition: transform 0.2s ease;
  flex-shrink: 0;
`;

const MenuDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.25rem 0;
`;

const MenuDividerLine = styled.div`
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
`;

const MenuDividerText = styled.span`
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: #475569;
  white-space: nowrap;
`;

const JoinFormCard = styled.div`
  width: 100%;
  max-width: 420px;
  padding: 2rem;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const JoinFormTitle = styled.h3`
  color: #e2e8f0;
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: 0.5px;
`;

const JoinFormSub = styled.p`
  color: #64748b;
  font-size: 0.85rem;
  margin: -0.25rem 0 0.5rem;
`;

const CodeInputRow = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
`;

const CodeChar = styled.div<{ $filled: boolean }>`
  width: 42px;
  height: 52px;
  border-radius: 10px;
  border: 2px solid ${({ $filled }) => ($filled ? "rgba(255, 45, 85, 0.5)" : "rgba(255, 255, 255, 0.1)")};
  background: ${({ $filled }) => ($filled ? "rgba(255, 45, 85, 0.08)" : "rgba(0, 0, 0, 0.2)")};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: 800;
  color: #e2e8f0;
  letter-spacing: 0;
  font-family: monospace;
  transition: all 0.15s ease;
`;

const HiddenCodeInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

const JoinFormActions = styled.div`
  display: flex;
  gap: 0.75rem;
  width: 100%;
  margin-top: 0.5rem;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  color: #6b7280;
  margin: 0.25rem 0;
  font-size: 0.9rem;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, #4b5563, transparent);
  }
`;

const RoomActions = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 0.5rem;
`;

const RoundSettingsCard = styled.div`
  width: 100%;
  max-width: 520px;
  padding: 1rem;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const RoundSettingsTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 800;
  color: #e2e8f0;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.75rem;
`;

const RowLabel = styled.div`
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 700;
`;

const Select = styled.select`
  width: 200px;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.25);
  color: #e2e8f0;
`;

const TimerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TimerInput = styled.input`
  width: 86px;
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.25);
  color: #e2e8f0;
`;

const TimerSuffix = styled.div`
  color: #94a3b8;
  font-size: 0.85rem;
`;

