"use client";

import { useState, useMemo, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import { WORD_DATA } from "./Themes";
import { FaArrowRight, FaArrowLeft, FaEyeSlash, FaUserSecret, FaUserAstronaut, FaTimes, FaCheck, FaUsers } from "react-icons/fa";

/* ============================================================
   ONE DEVICE MODE
   - All logic is local (no Firebase)
   - Players pass the device around to see their role, type words, and vote
   ============================================================ */

type LocalPlayer = {
  id: number;
  name: string;
};

type Phase =
  | "setup"        // add player names
  | "pickTheme"    // pick a theme
  | "reveal"       // pass-and-peek roles
  | "chat"         // turn-based word submission
  | "vote"         // everyone votes
  | "result";      // show who won

type WordEntry = {
  playerId: number;
  word: string;
  round: number;
};

const THEME_CATEGORIES = [
  { id: "nature", name: "Nature", items: ["Forest", "Mountains", "Beach", "Desert", "Jungle", "Arctic"] },
  { id: "animals", name: "Animals", items: ["Mammals", "Birds", "Reptiles", "Amphibians", "Fish", "Insects"] },
  { id: "food", name: "Food & Drink", items: ["Fruits", "Vegetables", "Desserts", "Beverages", "Snacks", "Meals"] },
  { id: "careers", name: "Careers", items: ["Doctor", "Engineer", "Teacher", "Artist", "Scientist", "Chef"] },
  { id: "technology", name: "Technology", items: ["Gadgets", "AI", "Programming", "Robotics", "Space Tech", "VR/AR"] },
  { id: "sports", name: "Sports", items: ["Soccer", "Basketball", "Tennis", "Swimming", "Athletics", "Cycling"] },
];

const ITEM_EMOJIS: Record<string, string> = {
  Forest: "🌲", Mountains: "⛰️", Beach: "🏖️", Desert: "🏜️", Jungle: "🌴", Arctic: "❄️",
  Mammals: "🐶", Birds: "🐦", Reptiles: "🦎", Amphibians: "🐸", Fish: "🐟", Insects: "🐞",
  Fruits: "🍎", Vegetables: "🥕", Desserts: "🍰", Beverages: "🥤", Snacks: "🍿", Meals: "🍽️",
  Doctor: "🩺", Engineer: "🛠️", Teacher: "📚", Artist: "🎨", Scientist: "🔬", Chef: "👨‍🍳",
  Gadgets: "📱", AI: "🤖", Programming: "💻", Robotics: "🦾", "Space Tech": "🚀", "VR/AR": "🕶️",
  Soccer: "⚽", Basketball: "🏀", Tennis: "🎾", Swimming: "🏊", Athletics: "🏃", Cycling: "🚴",
};

export default function OneDeviceGame({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>("setup");

  // Setup
  const [players, setPlayers] = useState<LocalPlayer[]>([
    { id: 1, name: "" },
    { id: 2, name: "" },
    { id: 3, name: "" },
  ]);
  const [nameInput, setNameInput] = useState("");

  // Theme
  const [activeCatId, setActiveCatId] = useState("nature");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

  // Game state
  const [secretWord, setSecretWord] = useState("");
  const [imposterIdx, setImposterIdx] = useState(0);
  const [currentRevealIdx, setCurrentRevealIdx] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  // Chat
  const [chatRound, setChatRound] = useState(1);
  const [chatTurnIdx, setChatTurnIdx] = useState(0);
  const [wordLog, setWordLog] = useState<WordEntry[]>([]);
  const [currentWord, setCurrentWord] = useState("");
  const [showPassScreen, setShowPassScreen] = useState(true);

  // Vote
  const [currentVoterIdx, setCurrentVoterIdx] = useState(0);
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [showVotePass, setShowVotePass] = useState(true);

  // Result
  const [winner, setWinner] = useState<"crew" | "imposter" | null>(null);
  const [eliminatedIdx, setEliminatedIdx] = useState(-1);

  const validPlayers = useMemo(() => players.filter((p) => p.name.trim()), [players]);
  const activeCat = THEME_CATEGORIES.find((c) => c.id === activeCatId);

  const addPlayer = useCallback(() => {
    if (players.length >= 10) return;
    setPlayers((p) => [...p, { id: p.length + 1, name: "" }]);
  }, [players.length]);

  const removePlayer = useCallback((idx: number) => {
    if (players.length <= 3) return;
    setPlayers((p) => p.filter((_, i) => i !== idx));
  }, [players.length]);

  const updateName = useCallback((idx: number, name: string) => {
    setPlayers((p) => p.map((pl, i) => (i === idx ? { ...pl, name } : pl)));
  }, []);

  const toggleTheme = useCallback((themeId: string) => {
    setSelectedThemes((prev) =>
      prev.includes(themeId) ? prev.filter((t) => t !== themeId) : [...prev, themeId]
    );
  }, []);

  const startGame = useCallback(() => {
    if (selectedThemes.length === 0) return;
    const allWords = selectedThemes.flatMap((t) => WORD_DATA[t] ?? []);
    if (!allWords.length) return;

    const word = allWords[Math.floor(Math.random() * allWords.length)];
    const impIdx = Math.floor(Math.random() * validPlayers.length);

    setSecretWord(word);
    setImposterIdx(impIdx);
    setCurrentRevealIdx(0);
    setIsRevealed(false);
    setChatRound(1);
    setChatTurnIdx(0);
    setWordLog([]);
    setCurrentWord("");
    setShowPassScreen(true);
    setCurrentVoterIdx(0);
    setVotes({});
    setShowVotePass(true);
    setWinner(null);
    setEliminatedIdx(-1);
    setPhase("reveal");
  }, [selectedThemes, validPlayers.length]);

  const handleRevealNext = () => {
    if (currentRevealIdx < validPlayers.length - 1) {
      setCurrentRevealIdx((i) => i + 1);
      setIsRevealed(false);
    } else {
      // All revealed, go to chat
      setShowPassScreen(true);
      setPhase("chat");
    }
  };

  const handleSubmitWord = () => {
    if (!currentWord.trim()) return;

    const entry: WordEntry = {
      playerId: chatTurnIdx,
      word: currentWord.trim(),
      round: chatRound,
    };
    setWordLog((prev) => [...prev, entry]);
    setCurrentWord("");

    const nextTurn = chatTurnIdx + 1;
    if (nextTurn >= validPlayers.length) {
      // End of round
      const nextRound = chatRound + 1;
      if (nextRound > 3) {
        // Go to vote
        setShowVotePass(true);
        setCurrentVoterIdx(0);
        setPhase("vote");
      } else {
        setChatRound(nextRound);
        setChatTurnIdx(0);
        setShowPassScreen(true);
      }
    } else {
      setChatTurnIdx(nextTurn);
      setShowPassScreen(true);
    }
  };

  const handleVote = (targetIdx: number) => {
    const newVotes = { ...votes, [currentVoterIdx]: targetIdx };
    setVotes(newVotes);

    const nextVoter = currentVoterIdx + 1;
    if (nextVoter >= validPlayers.length) {
      // Tally
      const tally: Record<number, number> = {};
      for (const v of Object.values(newVotes)) {
        tally[v] = (tally[v] ?? 0) + 1;
      }
      let maxVotes = 0;
      let eliminated = 0;
      for (const [idx, count] of Object.entries(tally)) {
        if (count > maxVotes) {
          maxVotes = count;
          eliminated = parseInt(idx);
        }
      }
      setEliminatedIdx(eliminated);
      setWinner(eliminated === imposterIdx ? "crew" : "imposter");
      setPhase("result");
    } else {
      setCurrentVoterIdx(nextVoter);
      setShowVotePass(true);
    }
  };

  const resetGame = () => {
    setPhase("setup");
    setSelectedTheme(null);
    setSecretWord("");
    setImposterIdx(0);
    setWordLog([]);
    setVotes({});
    setWinner(null);
  };

  return (
    <Container>
      {/* SETUP PHASE */}
      {phase === "setup" && (
        <PhaseContainer>
          <PhaseHeader>
            <BackBtn onClick={onBack}><FaArrowLeft /> Back</BackBtn>
            <PhaseTitle>One Device Mode</PhaseTitle>
            <PhaseSubtitle>Add 3-10 players, then pick a theme</PhaseSubtitle>
          </PhaseHeader>

          <PlayersList>
            {players.map((p, i) => (
              <PlayerRow key={i}>
                <PlayerNumber>{i + 1}</PlayerNumber>
                <PlayerInput
                  type="text"
                  placeholder={`Player ${i + 1} name...`}
                  value={p.name}
                  onChange={(e) => updateName(i, e.target.value.slice(0, 12))}
                  maxLength={12}
                />
                {players.length > 3 && (
                  <RemoveBtn onClick={() => removePlayer(i)} aria-label="Remove player">
                    <FaTimes />
                  </RemoveBtn>
                )}
              </PlayerRow>
            ))}
          </PlayersList>

          {players.length < 10 && (
            <AddPlayerBtn onClick={addPlayer}>+ Add Player</AddPlayerBtn>
          )}

          <ActionBtn
            $variant="primary"
            disabled={validPlayers.length < 3}
            onClick={() => setPhase("pickTheme")}
          >
            Continue <FaArrowRight />
          </ActionBtn>
        </PhaseContainer>
      )}

      {/* PICK THEME PHASE */}
      {phase === "pickTheme" && (
        <PhaseContainer>
          <PhaseHeader>
            <BackBtn onClick={() => setPhase("setup")}><FaArrowLeft /> Back</BackBtn>
            <PhaseTitle>Pick Themes</PhaseTitle>
            <PhaseSubtitle>Select one or more themes for the secret word</PhaseSubtitle>
          </PhaseHeader>

          <CatNav>
            {THEME_CATEGORIES.map((cat) => (
              <CatBtn
                key={cat.id}
                $active={cat.id === activeCatId}
                onClick={() => setActiveCatId(cat.id)}
              >
                {cat.name}
              </CatBtn>
            ))}
          </CatNav>

          <ThemeGrid>
            {(activeCat?.items ?? []).filter((t) => WORD_DATA[t]).map((theme) => (
              <ThemeCard
                key={theme}
                $selected={selectedThemes.includes(theme)}
                onClick={() => toggleTheme(theme)}
              >
                <ThemeEmoji>{ITEM_EMOJIS[theme] ?? "?"}</ThemeEmoji>
                <ThemeName>{theme}</ThemeName>
                {selectedThemes.includes(theme) && <ThemeCheck><FaCheck /></ThemeCheck>}
              </ThemeCard>
            ))}
          </ThemeGrid>

          {selectedThemes.length > 0 && (
            <SelectedCount>{selectedThemes.length} theme{selectedThemes.length > 1 ? 's' : ''} selected</SelectedCount>
          )}

          <ActionBtn
            $variant="primary"
            disabled={selectedThemes.length === 0}
            onClick={startGame}
          >
            Start Game <FaArrowRight />
          </ActionBtn>
        </PhaseContainer>
      )}

      {/* REVEAL PHASE */}
      {phase === "reveal" && (
        <PhaseContainer>
          <PassDeviceScreen>
            {!isRevealed ? (
              <>
                <PassIcon><FaUsers /></PassIcon>
                <PassTitle>
                  Pass to {validPlayers[currentRevealIdx]?.name}
                </PassTitle>
                <PassSub>
                  Player {currentRevealIdx + 1} of {validPlayers.length}
                </PassSub>
                <ActionBtn $variant="primary" onClick={() => setIsRevealed(true)}>
                  Reveal My Role
                </ActionBtn>
              </>
            ) : (
              <>
                <RoleCard $isImposter={currentRevealIdx === imposterIdx}>
                  <RoleIcon>
                    {currentRevealIdx === imposterIdx ? <FaUserSecret /> : <FaUserAstronaut />}
                  </RoleIcon>
                  <RoleLabel>
                    {currentRevealIdx === imposterIdx ? "IMPOSTER" : "CREW MEMBER"}
                  </RoleLabel>
                  <SecretBox $isImposter={currentRevealIdx === imposterIdx}>
                    <SecretLabel>
                      {currentRevealIdx === imposterIdx ? "Your Hint" : "Secret Word"}
                    </SecretLabel>
                    <SecretValue>
                      {currentRevealIdx === imposterIdx
                        ? `Theme${selectedThemes.length > 1 ? 's' : ''}: ${selectedThemes.join(', ')}`
                        : secretWord}
                    </SecretValue>
                  </SecretBox>
                </RoleCard>
                <ActionBtn $variant="secondary" onClick={handleRevealNext}>
                  {currentRevealIdx < validPlayers.length - 1 ? (
                    <>Hide & Pass to Next <FaArrowRight /></>
                  ) : (
                    <>Everyone Ready - Start Chat <FaArrowRight /></>
                  )}
                </ActionBtn>
              </>
            )}
          </PassDeviceScreen>
        </PhaseContainer>
      )}

      {/* CHAT PHASE */}
      {phase === "chat" && (
        <PhaseContainer>
          {showPassScreen ? (
            <PassDeviceScreen>
              <PassIcon><FaEyeSlash /></PassIcon>
              <PassTitle>
                Pass to {validPlayers[chatTurnIdx]?.name}
              </PassTitle>
              <PassSub>
                Round {chatRound}/3 - Turn {chatTurnIdx + 1}/{validPlayers.length}
              </PassSub>
              <ActionBtn $variant="primary" onClick={() => setShowPassScreen(false)}>
                {"I'm Ready"}
              </ActionBtn>
            </PassDeviceScreen>
          ) : (
            <>
              <PhaseHeader>
                <PhaseTitle>
                  {validPlayers[chatTurnIdx]?.name || "Player"}&apos;s Turn
                </PhaseTitle>
                <PhaseSubtitle>Round {chatRound}/3 - Type ONE word related to the theme</PhaseSubtitle>
              </PhaseHeader>

              {wordLog.length > 0 && (
                <WordHistory>
                  {wordLog.map((w, i) => (
                    <WordBubble key={i}>
                      <WordAuthor>{validPlayers[w.playerId]?.name}</WordAuthor>
                      <WordText>{w.word}</WordText>
                    </WordBubble>
                  ))}
                </WordHistory>
              )}

              <WordInputRow>
                <WordInput
                  type="text"
                  placeholder="Type your word..."
                  value={currentWord}
                  onChange={(e) => setCurrentWord(e.target.value.replace(/\s/g, "").slice(0, 20))}
                  maxLength={20}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmitWord(); }}
                />
                <ActionBtn
                  $variant="primary"
                  disabled={!currentWord.trim()}
                  onClick={handleSubmitWord}
                  style={{ marginTop: 0 }}
                >
                  Send
                </ActionBtn>
              </WordInputRow>
            </>
          )}
        </PhaseContainer>
      )}

      {/* VOTE PHASE */}
      {phase === "vote" && (
        <PhaseContainer>
          {showVotePass ? (
            <PassDeviceScreen>
              <PassIcon><FaEyeSlash /></PassIcon>
              <PassTitle>
                Pass to {validPlayers[currentVoterIdx]?.name}
              </PassTitle>
              <PassSub>Vote for who you think is the imposter</PassSub>
              <ActionBtn $variant="primary" onClick={() => setShowVotePass(false)}>
                {"I'm Ready to Vote"}
              </ActionBtn>
            </PassDeviceScreen>
          ) : (
            <>
              <PhaseHeader>
                <PhaseTitle>{validPlayers[currentVoterIdx]?.name}&apos;s Vote</PhaseTitle>
                <PhaseSubtitle>Who do you think is the imposter?</PhaseSubtitle>
              </PhaseHeader>

              {wordLog.length > 0 && (
                <WordHistory>
                  {wordLog.map((w, i) => (
                    <WordBubble key={i}>
                      <WordAuthor>{validPlayers[w.playerId]?.name}</WordAuthor>
                      <WordText>{w.word}</WordText>
                    </WordBubble>
                  ))}
                </WordHistory>
              )}

              <VoteGrid>
                {validPlayers.map((p, i) => (
                  i !== currentVoterIdx && (
                    <VoteBtn key={i} onClick={() => handleVote(i)}>
                      <VoteName>{p.name}</VoteName>
                    </VoteBtn>
                  )
                ))}
              </VoteGrid>
            </>
          )}
        </PhaseContainer>
      )}

      {/* RESULT PHASE */}
      {phase === "result" && (
        <PhaseContainer>
          <ResultScreen>
            <ResultBadge $winner={winner ?? "crew"}>
              {winner === "crew" ? "CREW WINS" : "IMPOSTER WINS"}
            </ResultBadge>

            <ResultInfo>
              <ResultRow>
                <ResultLabel>The Imposter was</ResultLabel>
                <ResultValue $highlight>{validPlayers[imposterIdx]?.name}</ResultValue>
              </ResultRow>
              <ResultRow>
                <ResultLabel>Eliminated</ResultLabel>
                <ResultValue>{validPlayers[eliminatedIdx]?.name}</ResultValue>
              </ResultRow>
              <ResultRow>
                <ResultLabel>Secret Word</ResultLabel>
                <ResultValue>{secretWord}</ResultValue>
              </ResultRow>
            </ResultInfo>

            <WordHistory>
              <WordHistoryTitle>Word Log</WordHistoryTitle>
              {wordLog.map((w, i) => (
                <WordBubble key={i} $isImposter={w.playerId === imposterIdx}>
                  <WordAuthor>{validPlayers[w.playerId]?.name} {w.playerId === imposterIdx ? "(Imposter)" : ""}</WordAuthor>
                  <WordText>{w.word}</WordText>
                </WordBubble>
              ))}
            </WordHistory>

            <ResultActions>
              <ActionBtn $variant="primary" onClick={resetGame}>
                Play Again
              </ActionBtn>
              <ActionBtn $variant="secondary" onClick={onBack}>
                Back to Menu
              </ActionBtn>
            </ResultActions>
          </ResultScreen>
        </PhaseContainer>
      )}
    </Container>
  );
}

/* =================== STYLED COMPONENTS =================== */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  animation: ${fadeIn} 0.4s ease-out;
`;

const PhaseContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  width: 100%;
`;

const PhaseHeader = styled.div`
  text-align: center;
  width: 100%;
`;

const PhaseTitle = styled.h2`
  color: #e2e8f0;
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: 0.02em;
`;

const PhaseSubtitle = styled.p`
  color: #64748b;
  font-size: 0.85rem;
  margin: 0.25rem 0 0;
`;

const BackBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  transition: all 0.2s ease;

  &:hover {
    color: #e2e8f0;
    background: rgba(30, 41, 59, 0.9);
  }
`;

/* Setup */
const PlayersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-width: 400px;
`;

const PlayerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PlayerNumber = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(255, 45, 85, 0.12);
  border: 1px solid rgba(255, 45, 85, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  color: #ff2d55;
  flex-shrink: 0;
`;

const PlayerInput = styled.input`
  flex: 1;
  padding: 0.65rem 0.85rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 0.9rem;
  transition: all 0.15s ease;

  &:focus {
    outline: none;
    border-color: rgba(255, 45, 85, 0.4);
    box-shadow: 0 0 0 3px rgba(255, 45, 85, 0.08);
  }
  &::placeholder { color: #475569; }
`;

const RemoveBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.7rem;
  flex-shrink: 0;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.25);
  }
`;

const AddPlayerBtn = styled.button`
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  color: #64748b;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s ease;
  width: 100%;
  max-width: 400px;

  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
    color: #94a3b8;
  }
`;

const ActionBtn = styled.button<{ $variant: "primary" | "secondary" }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid ${({ $variant }) =>
    $variant === "primary" ? "rgba(255, 45, 85, 0.4)" : "rgba(255, 255, 255, 0.1)"};
  border-radius: 12px;
  background: ${({ $variant }) =>
    $variant === "primary"
      ? "linear-gradient(135deg, rgba(255, 45, 85, 0.2), rgba(220, 38, 38, 0.15))"
      : "rgba(30, 41, 59, 0.6)"};
  color: ${({ $variant }) => ($variant === "primary" ? "#ff2d55" : "#94a3b8")};
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: ${({ $variant }) =>
      $variant === "primary"
        ? "0 6px 24px rgba(255, 45, 85, 0.2)"
        : "0 6px 24px rgba(0, 0, 0, 0.3)"};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

/* Theme picker */
const CatNav = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: center;
  width: 100%;
`;

const CatBtn = styled.button<{ $active: boolean }>`
  border: 1.5px solid ${({ $active }) => ($active ? "rgba(255, 45, 85, 0.4)" : "rgba(255,255,255,0.08)")};
  border-radius: 8px;
  padding: 0.45rem 0.8rem;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.8rem;
  background: ${({ $active }) => ($active ? "rgba(255, 45, 85, 0.1)" : "transparent")};
  color: ${({ $active }) => ($active ? "#ff2d55" : "#94a3b8")};
  transition: all 0.15s ease;

  &:hover {
    color: #e2e8f0;
  }
`;

const ThemeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
  width: 100%;
`;

const ThemeCard = styled.button<{ $selected: boolean }>`
  position: relative;
  border-radius: 12px;
  padding: 0.85rem 0.7rem;
  border: 2px solid ${({ $selected }) => ($selected ? "rgba(255, 45, 85, 0.5)" : "rgba(255,255,255,0.06)")};
  background: ${({ $selected }) => ($selected ? "rgba(255, 45, 85, 0.1)" : "rgba(15, 23, 42, 0.5)")};
  color: ${({ $selected }) => ($selected ? "#fff" : "#cbd5e1")};
  cursor: pointer;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 45, 85, 0.4);
  }
`;

const ThemeEmoji = styled.div`
  font-size: 1.4rem;
`;

const ThemeName = styled.div`
  font-weight: 700;
  font-size: 0.8rem;
`;

const ThemeCheck = styled.div`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(255, 45, 85, 0.5);
  display: grid;
  place-items: center;
  font-size: 8px;
  color: #fff;
`;

const SelectedCount = styled.div`
  text-align: center;
  font-size: 0.85rem;
  color: #94a3b8;
  margin-top: 0.25rem;
`;

/* Pass device screen */
const PassDeviceScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 300px;
  text-align: center;
  padding: 2rem;
  width: 100%;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
`;

const PassIcon = styled.div`
  font-size: 2.5rem;
  color: rgba(255, 45, 85, 0.5);
`;

const PassTitle = styled.h2`
  color: #e2e8f0;
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0;
`;

const PassSub = styled.p`
  color: #64748b;
  font-size: 0.85rem;
  margin: 0;
`;

/* Role reveal */
const RoleCard = styled.div<{ $isImposter: boolean }>`
  padding: 2rem;
  border-radius: 20px;
  border: 2px solid ${({ $isImposter }) =>
    $isImposter ? "rgba(255, 45, 85, 0.4)" : "rgba(59, 130, 246, 0.4)"};
  background: ${({ $isImposter }) =>
    $isImposter
      ? "linear-gradient(145deg, rgba(69, 10, 10, 0.8), rgba(127, 29, 29, 0.5))"
      : "linear-gradient(145deg, rgba(12, 74, 110, 0.8), rgba(3, 105, 161, 0.5))"};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 350px;
`;

const RoleIcon = styled.div`
  font-size: 3rem;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.2));
`;

const RoleLabel = styled.div`
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: #fff;
`;

const SecretBox = styled.div<{ $isImposter: boolean }>`
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  width: 100%;
`;

const SecretLabel = styled.div`
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #94a3b8;
  margin-bottom: 0.25rem;
`;

const SecretValue = styled.div`
  font-size: 1.2rem;
  font-weight: 800;
  color: #e2e8f0;
`;

/* Chat / Word history */
const WordHistory = styled.div`
  width: 100%;
  max-height: 250px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.75rem;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 14px;
`;

const WordHistoryTitle = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.25rem;
`;

const WordBubble = styled.div<{ $isImposter?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.7rem;
  border-radius: 8px;
  background: ${({ $isImposter }) => ($isImposter ? "rgba(255, 45, 85, 0.08)" : "rgba(30, 41, 59, 0.4)")};
  border: 1px solid ${({ $isImposter }) => ($isImposter ? "rgba(255, 45, 85, 0.2)" : "rgba(255,255,255,0.04)")};
`;

const WordAuthor = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  min-width: 60px;
`;

const WordText = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: #e2e8f0;
`;

const WordInputRow = styled.div`
  display: flex;
  gap: 0.5rem;
  width: 100%;
  align-items: center;
`;

const WordInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #e2e8f0;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: rgba(255, 45, 85, 0.4);
    box-shadow: 0 0 0 3px rgba(255, 45, 85, 0.08);
  }
  &::placeholder { color: #475569; }
`;

/* Vote */
const VoteGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.6rem;
  width: 100%;
`;

const VoteBtn = styled.button`
  padding: 1rem;
  border-radius: 14px;
  border: 2px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.5);
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 700;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(255, 45, 85, 0.5);
    background: rgba(255, 45, 85, 0.1);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }
`;

const VoteName = styled.div`
  font-size: 1rem;
`;

/* Result */
const ResultScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  width: 100%;
`;

const ResultBadge = styled.div<{ $winner: "crew" | "imposter" }>`
  padding: 0.75rem 2rem;
  border-radius: 14px;
  font-size: 1.4rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: #fff;
  background: ${({ $winner }) =>
    $winner === "crew"
      ? "linear-gradient(135deg, #0369a1, #0c4a6e)"
      : "linear-gradient(135deg, #dc2626, #991b1b)"};
  border: 2px solid ${({ $winner }) =>
    $winner === "crew" ? "rgba(3, 105, 161, 0.5)" : "rgba(220, 38, 38, 0.5)"};
  box-shadow: 0 4px 20px ${({ $winner }) =>
    $winner === "crew" ? "rgba(3, 105, 161, 0.3)" : "rgba(220, 38, 38, 0.3)"};
`;

const ResultInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-width: 350px;
`;

const ResultRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.85rem;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const ResultLabel = styled.span`
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
`;

const ResultValue = styled.span<{ $highlight?: boolean }>`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ $highlight }) => ($highlight ? "#ff2d55" : "#e2e8f0")};
`;

const ResultActions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
`;
