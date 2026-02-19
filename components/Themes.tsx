"use client";

import { useMemo, useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useTheme } from "./ThemeContext";
import { setLobbyThemes } from "@/firebase/lobby";
import PlayButton from "./PlayButton";

/* ---------------- DATA: ORDBANK ---------------- */

export const WORD_DATA: Record<string, string[]> = {
  Forest: ["Tree", "Bear", "Mushroom", "Cabin", "Path", "Wolf", "Owl", "Campfire"],
  Mountains: ["Snow", "Climbing", "Goat", "Peak", "Skiing", "Yeti", "Cave", "Echo"],
  Beach: ["Sand", "Ocean", "Sun", "Crab", "Towel", "Surfing", "Shell", "Shark"],
  Desert: ["Cactus", "Camel", "Sand", "Scorpion", "Oasis", "Pyramid", "Heat", "Lizard"],
  Jungle: ["Tiger", "Vine", "Monkey", "Rain", "Snake", "Parrot", "Waterfall", "Jaguar"],
  Arctic: ["Penguin", "Ice", "Polar Bear", "Snow", "Igloo", "Seal", "Cold", "Glacier"],

  Animals: ["Lion", "Elephant", "Giraffe", "Zebra", "Monkey", "Tiger", "Kangaroo", "Panda"],
  Mammals: ["Lion", "Dog", "Cat", "Human", "Whale", "Bat", "Horse", "Mouse"],
  Birds: ["Eagle", "Penguin", "Parrot", "Owl", "Duck", "Chicken", "Peacock", "Swan"],
  Reptiles: ["Snake", "Lizard", "Turtle", "Crocodile", "Chameleon", "Gecko", "Iguana", "Cobra"],
  Amphibians: ["Frog", "Toad", "Salamander", "Newt", "Tadpole", "Axolotl"],
  Fish: ["Shark", "Goldfish", "Salmon", "Tuna", "Clownfish", "Piranha", "Eel", "Stingray"],
  Insects: ["Ant", "Bee", "Butterfly", "Spider", "Mosquito", "Beetle", "Fly", "Worm"],

  Fruits: ["Apple", "Banana", "Orange", "Grape", "Strawberry", "Watermelon", "Lemon", "Cherry"],
  Vegetables: ["Carrot", "Potato", "Broccoli", "Corn", "Onion", "Tomato", "Spinach", "Pepper"],
  Desserts: ["Cake", "Ice Cream", "Chocolate", "Cookie", "Donut", "Pie", "Brownie", "Pudding"],
  Beverages: ["Water", "Coffee", "Tea", "Soda", "Juice", "Milk", "Beer", "Wine"],
  Snacks: ["Chips", "Popcorn", "Nuts", "Pretzel", "Candy", "Cracker", "Cheese", "Jerky"],
  Meals: ["Pizza", "Burger", "Pasta", "Sushi", "Steak", "Taco", "Soup", "Salad"],

  Doctor: ["Hospital", "Stethoscope", "Medicine", "Nurse", "Surgery", "Patient", "White Coat"],
  Engineer: ["Blueprint", "Bridge", "Math", "Helmet", "Computer", "Build", "Machine"],
  Teacher: ["School", "Chalkboard", "Student", "Book", "Homework", "Classroom", "Apple"],
  Artist: ["Paint", "Brush", "Canvas", "Color", "Gallery", "Sculpture", "Sketch"],
  Scientist: ["Lab", "Experiment", "Chemical", "Microscope", "Coat", "Discovery", "Formula"],
  Chef: ["Kitchen", "Knife", "Hat", "Cooking", "Restaurant", "Recipe", "Oven", "Taste"],

  Gadgets: ["Phone", "Watch", "Tablet", "Camera", "Headphones", "Drone", "Laptop"],
  AI: ["Robot", "Code", "Future", "Smart", "Computer", "Data", "Brain"],
  Programming: ["Code", "Bug", "Laptop", "Coffee", "Keyboard", "Screen", "Developer"],
  Robotics: ["Metal", "Battery", "Wire", "Motor", "Sensor", "Cyborg", "Factory"],
  "Space Tech": ["Rocket", "Satellite", "Rover", "Station", "Telescope", "Suit", "Launch"],
  "VR/AR": ["Goggles", "Virtual", "Game", "3D", "Headset", "Reality", "Motion"],

  Soccer: ["Ball", "Goal", "Grass", "Referee", "Team", "Kick", "World Cup"],
  Basketball: ["Hoop", "Court", "Dunk", "Net", "Jersey", "NBA", "Dribble"],
  Tennis: ["Racket", "Net", "Ball", "Court", "Serve", "Wimbledon", "Love"],
  Swimming: ["Pool", "Water", "Goggles", "Race", "Dive", "Swimsuit", "Stroke"],
  Athletics: ["Run", "Jump", "Track", "Gold", "Sprint", "Hurdle", "Relay"],
  Cycling: ["Bike", "Helmet", "Road", "Tour", "Wheel", "Pedal", "Race"],

  Planets: ["Mars", "Venus", "Jupiter", "Saturn", "Earth", "Neptune", "Mercury", "Uranus"],
  Movies: ["Popcorn", "Cinema", "Actor", "Screen", "Ticket", "Hollywood", "Director", "Oscar"],
  "Video Games": ["Controller", "Console", "Level", "Boss", "Score", "Player", "Online"],
  Landscapes: ["Mountain", "River", "Valley", "Ocean", "Desert", "Forest", "City"],
};

const ITEM_EMOJIS: Record<string, string> = {
  // Nature
  Forest: "🌲",
  Mountains: "⛰️",
  Beach: "🏖️",
  Desert: "🏜️",
  Jungle: "🌴",
  Arctic: "❄️",

  // Animals
  Mammals: "🐶",
  Birds: "🐦",
  Reptiles: "🦎",
  Amphibians: "🐸",
  Fish: "🐟",
  Insects: "🐞",

  // Food & Drink
  Fruits: "🍎",
  Vegetables: "🥕",
  Desserts: "🍰",
  Beverages: "🥤",
  Snacks: "🍿",
  Meals: "🍽️",

  // Careers
  Doctor: "🩺",
  Engineer: "🛠️",
  Teacher: "📚",
  Artist: "🎨",
  Scientist: "🔬",
  Chef: "👨‍🍳",

  // Technology
  Gadgets: "📱",
  AI: "🤖",
  Programming: "💻",
  Robotics: "🦾",
  "Space Tech": "🚀",
  "VR/AR": "🕶️",

  // Sports
  Soccer: "⚽",
  Basketball: "🏀",
  Tennis: "🎾",
  Swimming: "🏊",
  Athletics: "🏃",
  Cycling: "🚴",
};


/* ---------------- types ---------------- */

interface ThemesProps {
  onBack: () => void;
  onStartGame: () => void;
  isHost: boolean;
  canStartGame: boolean;
  inviteCode: string;
  hostUid: string;
  initialSelectedThemeIds?: string[];
}

/* ---------------- component ---------------- */

export default function Themes({
  onBack,
  onStartGame,
  isHost,
  canStartGame,
  inviteCode,
  hostUid,
  initialSelectedThemeIds,
}: ThemesProps) {
  const { selectedThemeIds, toggleTheme, setThemes } = useTheme();

  const themeCategories = useMemo(
    () => [
      { id: "nature", name: "Nature", items: ["Forest", "Mountains", "Beach", "Desert", "Jungle", "Arctic"] },
      { id: "animals", name: "Animals", items: ["Mammals", "Birds", "Reptiles", "Amphibians", "Fish", "Insects"] },
      { id: "food", name: "Food & Drink", items: ["Fruits", "Vegetables", "Desserts", "Beverages", "Snacks", "Meals"] },
      { id: "careers", name: "Careers", items: ["Doctor", "Engineer", "Teacher", "Artist", "Scientist", "Chef"] },
      { id: "technology", name: "Technology", items: ["Gadgets", "AI", "Programming", "Robotics", "Space Tech", "VR/AR"] },
      { id: "sports", name: "Sports", items: ["Soccer", "Basketball", "Tennis", "Swimming", "Athletics", "Cycling"] },
    ],
    []
  );

  const featuredThemes = useMemo(() => ["Animals", "Planets", "Movies", "Video Games", "Landscapes"], []);

  const isValidTheme = (t: string) => Array.isArray(WORD_DATA[t]);

  // ✅ “active category” (som i html-eksempelet)
  const [activeCategoryId, setActiveCategoryId] = useState<string>(themeCategories[0]?.id ?? "nature");

  // sørg for at activeCategory alltid finnes hvis categories endres
  useEffect(() => {
    if (!themeCategories.some((c) => c.id === activeCategoryId)) {
      setActiveCategoryId(themeCategories[0]?.id ?? "nature");
    }
  }, [activeCategoryId, themeCategories]);

  useEffect(() => {
    if (!Array.isArray(initialSelectedThemeIds)) return;
    setThemes(initialSelectedThemeIds);
  }, [initialSelectedThemeIds]);

  const activeCategory = themeCategories.find((c) => c.id === activeCategoryId);

  const handleSelectTheme = async (themeId: string) => {
    if (!isHost) return;
    if (!inviteCode || !hostUid) return;
    if (!isValidTheme(themeId)) return;

    const nextSelected = selectedThemeIds.includes(themeId)
      ? selectedThemeIds.filter((t) => t !== themeId)
      : [...selectedThemeIds, themeId];

    toggleTheme(themeId);
    await setLobbyThemes(inviteCode, hostUid, nextSelected);
  };

  // glare stuff (samme som før, men litt enklere)
  const [glareStates, setGlareStates] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const ids = featuredThemes.map((_, i) => `featured-${i}`);
    let cancelled = false;

    const loop = () => {
      if (cancelled) return;
      const pick = ids[Math.floor(Math.random() * ids.length)];
      const delay = Math.random() * 8000 + 2000;

      setTimeout(() => {
        if (cancelled) return;
        setGlareStates((p) => ({ ...p, [pick]: true }));
        setTimeout(() => {
          if (cancelled) return;
          setGlareStates((p) => ({ ...p, [pick]: false }));
          loop();
        }, 900);
      }, delay);
    };

    loop();
    return () => {
      cancelled = true;
    };
  }, [featuredThemes]);

  return (
    <ThemesContainer>
      <BackButton onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Lobby
      </BackButton>

      <GlowingBorder>
        <FeaturedThemes>
          <FeaturedTitle>Featured Themes</FeaturedTitle>
          <FeaturedThemesGrid>
            {featuredThemes
              .filter(isValidTheme)
              .slice(0, 4)
              .map((theme, index) => (
                <FeaturedThemeButton
                  key={theme}
                  $isSelected={selectedThemeIds.includes(theme)}
                  onClick={() => handleSelectTheme(theme)}
                  disabled={!isHost}
                  title={!isHost ? "Only host can choose theme" : ""}
                >
                  <GlareEffect $show={glareStates[`featured-${index}`] || false} />
                  <CheckDot $isSelected={selectedThemeIds.includes(theme)}>✓</CheckDot>
                  {theme}
                </FeaturedThemeButton>
              ))}
          </FeaturedThemesGrid>
        </FeaturedThemes>
      </GlowingBorder>

      {/* ✅ Category “nav” (som eksempelet ditt) */}
      <CategoryNav>
        {themeCategories.map((cat) => (
          <CategoryBtn
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            $active={cat.id === activeCategoryId}
          >
            {cat.name}
          </CategoryBtn>
        ))}
      </CategoryNav>

      {/* ✅ Options panel under (ikke dropdown) */}
      <OptionsPanel>
        <OptionsTitle>
          {activeCategory?.name ?? "Options"}
          <SmallHint>Pick themes</SmallHint>
        </OptionsTitle>

        <OptionsGrid>
          {(activeCategory?.items ?? [])
            .filter(isValidTheme)
            .map((item) => {
              const selected = selectedThemeIds.includes(item);
              return (
                <OptionCard
                  key={item}
                  $selected={selected}
                  onClick={() => handleSelectTheme(item)}
                  disabled={!isHost}
                >
                  <ItemEmoji>{ITEM_EMOJIS[item] ?? "✨"}</ItemEmoji>
                  <OptionName>{item}</OptionName>
                  {selected && <SelectedBadge>✓</SelectedBadge>}
                </OptionCard>

              );
            })}
        </OptionsGrid>
      </OptionsPanel>

      <Footer>
        {!isHost ? (
          <WaitingText>Waiting for host to choose a theme...</WaitingText>
        ) : (
          <PlayButton onClick={onStartGame} disabled={!canStartGame} />
        )}
      </Footer>
    </ThemesContainer>
  );
}

/* ---------------- styles ---------------- */

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const fadeSlideIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ThemesContainer = styled.div`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
  position: relative;
  padding-bottom: 5.5rem;
  animation: ${fadeSlideIn} 0.4s ease-out;
`;

const BackButton = styled.button`
  position: absolute;
  top: -50px;
  left: 0;
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(8px);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.5rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(30, 41, 59, 1);
    color: #e2e8f0;
    transform: translateX(-2px);
  }
`;

const ThemesHeader = styled.h2`
  color: #d1d5db;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;
`;

const GlowingBorder = styled.div`
  position: relative;
  padding: 2px;
  border-radius: 18px;
  background: linear-gradient(135deg, #ff2d55, #dc2626, #ff2d55);
  background-size: 200% 200%;
  animation: ${gradientFlow} 4s ease infinite;
  margin: 0 auto 1.5rem;
  box-shadow: 0 0 20px rgba(255, 45, 85, 0.15);
`;

const FeaturedThemes = styled.div`
  display: flex;
  flex-direction: column;
  background: rgba(15, 23, 42, 0.95);
  border-radius: 16px;
  padding: 1.5rem;
  align-items: center;
  text-align: center;
  width: 100%;
`;

const FeaturedTitle = styled.h3`
  color: #e2e8f0;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 1rem;
  color: #94a3b8;
`;

const FeaturedThemesGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.6rem;
`;

const FeaturedThemeButton = styled.button<{ $isSelected: boolean }>`
  position: relative;
  overflow: hidden;
  border: 2px solid ${({ $isSelected }) => ($isSelected ? "rgba(255, 45, 85, 0.5)" : "rgba(255,255,255,0.06)")};
  border-radius: 12px;
  padding: 0.7rem 0.85rem;
  cursor: pointer;
  color: ${({ $isSelected }) => ($isSelected ? "#fff" : "#cbd5e1")};
  background: ${({ $isSelected }) =>
    $isSelected ? "rgba(255, 45, 85, 0.15)" : "rgba(30, 41, 59, 0.5)"};
  transition: all 0.2s ease;
  text-align: left;
  font-weight: 700;
  font-size: 0.9rem;

  &:hover {
    transform: translateY(-2px);
    border-color: ${({ $isSelected }) =>
      $isSelected ? "rgba(255, 45, 85, 0.7)" : "rgba(255,255,255,0.15)"};
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const GlareEffect = styled.span<{ $show: boolean }>`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 200, 221, 0.2) 25%,
    rgba(255, 200, 221, 0.25) 45%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: translateX(${({ $show }) => ($show ? "200%" : "-100%")});
  transition: transform 0.8s ease;
  pointer-events: none;
`;

const CheckDot = styled.span<{ $isSelected: boolean }>`
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 6px;
  background: ${({ $isSelected }) => ($isSelected ? "rgba(255, 45, 85, 0.4)" : "rgba(255,255,255,0.06)")};
  font-size: 11px;
  font-weight: 900;
  border: 1.5px solid ${({ $isSelected }) => ($isSelected ? "rgba(255, 45, 85, 0.6)" : "rgba(255,255,255,0.1)")};
`;

const CategoryNav = styled.div`
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
`;

const CategoryBtn = styled.button<{ $active: boolean }>`
  border: 1.5px solid ${({ $active }) => ($active ? "rgba(255, 45, 85, 0.4)" : "rgba(255,255,255,0.08)")};
  border-radius: 10px;
  padding: 0.55rem 1rem;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.3px;
  background: ${({ $active }) => ($active ? "rgba(255, 45, 85, 0.12)" : "rgba(30, 41, 59, 0.4)")};
  color: ${({ $active }) => ($active ? "#ff2d55" : "#94a3b8")};
  transition: all 0.2s ease;

  &:hover {
    color: ${({ $active }) => ($active ? "#ff2d55" : "#e2e8f0")};
    border-color: ${({ $active }) => ($active ? "rgba(255, 45, 85, 0.6)" : "rgba(255,255,255,0.15)")};
    transform: translateY(-1px);
  }
`;

const OptionsPanel = styled.div`
  margin-top: 1rem;
  background: rgba(30, 41, 59, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 1.25rem;
  animation: ${fadeSlideIn} 0.25s ease-out;
`;

const OptionsTitle = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  color: #e2e8f0;
  font-weight: 800;
  font-size: 1rem;
  margin-bottom: 0.75rem;
`;

const SmallHint = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.6rem;
`;

const OptionCard = styled.button<{ $selected: boolean }>`
  position: relative;
  border-radius: 14px;
  padding: 1rem 0.85rem;
  border: 2px solid ${({ $selected }) => ($selected ? "rgba(255, 45, 85, 0.45)" : "rgba(255,255,255,0.06)")};
  background: ${({ $selected }) =>
    $selected ? "rgba(255, 45, 85, 0.1)" : "rgba(15, 23, 42, 0.5)"};
  color: ${({ $selected }) => ($selected ? "#fff" : "#cbd5e1")};
  cursor: pointer;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    border-color: ${({ $selected }) => ($selected ? "rgba(255, 45, 85, 0.7)" : "rgba(255,255,255,0.12)")};
    background: ${({ $selected }) =>
      $selected ? "rgba(255, 45, 85, 0.15)" : "rgba(30, 41, 59, 0.5)"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ItemEmoji = styled.div`
  font-size: 1.6rem;
  line-height: 1;
`;

const OptionName = styled.div`
  font-weight: 800;
  font-size: 0.9rem;
`;

const SelectedBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 45, 85, 0.4);
  border: 1.5px solid rgba(255, 45, 85, 0.6);
  font-weight: 900;
  font-size: 10px;
  color: #fff;
`;

const Footer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 0 0 22px 22px;
`;

const WaitingText = styled.div`
  color: #64748b;
  font-style: italic;
  font-size: 0.85rem;
`;
