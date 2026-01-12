"use client";

import { useState, useEffect } from 'react';
import Lobby from "@/components/Lobby";
import Themes from "@/components/Themes";
import styled from 'styled-components';
import { FaCog } from 'react-icons/fa';
import { AstronautAvatar } from '@/components/avatar';
import Image from 'next/image';
import voteVImage from '/Vote_V.png';


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
`;
const StarBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  z-index: 1;
  overflow: hidden;
`;
const Star = styled.div<{ $top: string; $left: string; $delay: string }>`
  position: absolute;
  top: ${({ $top }) => $top};
  left: ${({ $left }) => $left};
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
  animation: twinkle 3s infinite;
  animation-delay: ${({ $delay }) => $delay};
  opacity: 0.7;
  @keyframes twinkle {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 1; }
  }
`;

const Title = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 2rem;
  margin-left: 35%;
  background: linear-gradient(45deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const GlowEffect = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(99, 102, 241, 0.1) 0%,
    rgba(16, 24, 39, 0) 70%
  );
  pointer-events: none;
  z-index: 1;
`;

const MainContainer = styled.main`
  width: 100%;
  max-width: 1200px;
  position: relative;
  z-index: 2;
  overflow: visible;
`;

const PlayerContainer = styled.div`
display: flex;
flex-direction: row;
justify-content: center;
 width: 300px;
 height: 200px;
 gap: 5rem;
 background: #1e293b;
 border: 1px  white solid;
 border-radius: 0 0 0 60px;
 position: absolute;
 top: -4px;
 right: -1px
`;

const Bar = styled.div`
display: flex;
flex-direction: column;
gap: 5rem;
justify-content: center;
text-align: center;

`;

const Bar_2 = styled.div`
display: flex;
flex-direction: column;
gap: 40px;
justify-content: center;
`;
const Player = styled.div`
postion: absoulte;
dispay: grid;

`;

const PlayerName = styled.div`

  color: #94a3b8;
`;
const VoteBadge = styled.div`
  top: 10px;
  right: 60px;
  z-index: 10;
  
  img {
    width: 60px;
    height: 60px;
    object-fit: contain;
  }
`;
const Settings = styled.div`
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
    transform: scale(1.1);
    box-shadow: 0 0 15px rgba(99, 102, 241, 0.5);
  }
`;

const InviteCode = styled.div`
  position: absolute;
  margin-top: 1rem;
  text-align: center;
  color: #e5e7eb;
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
  
  &:active {
    transform: translateY(0);
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
  position: ${({ $isActive }) => ($isActive ? 'relative' : 'absolute')};
  opacity: ${({ $isActive }) => ($isActive ? 1 : 0)};
  pointer-events: ${({ $isActive }) => ($isActive ? 'auto' : 'none')};
  transform: ${({ $isActive }) => ($isActive ? 'translateY(0)' : 'translateY(20px)')};
`;

const StarryBackground = () => {
  const [stars, setStars] = useState<Array<{ id: number, top: string, left: string, delay: string }>>([]);
  useEffect(() => {
    const starsArray = Array(100).fill(0).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`
    }));
    setStars(starsArray);
  }, []);
  return (
    <StarBackground>
      {stars.map(star => (
        <Star
          key={star.id}
          $top={star.top}
          $left={star.left}
          $delay={star.delay}
        />
      ))}
    </StarBackground>
  );
};

export default function Home() {
  const [showThemes, setShowThemes] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking characters
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setInviteCode(code);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <StarryBackground />
      <PageContainer>
        <GlowEffect />
        <PlayerContainer>
          <Bar>
            <Player>
              <AstronautAvatar size={100} />
              <PlayerName>Player 101</PlayerName>
            </Player>
          </Bar>
          <Bar_2>
            <VoteBadge>
              <Image
                src="/Vote_V.png"
                alt="Vote V"
                width={50}
                height={50}
                priority
              />
            </VoteBadge>
            <Settings>
              <FaCog />
            </Settings>
          </Bar_2>

        </PlayerContainer>
        <MainContainer>
          <InviteCode>
            <CodeLabel>Invite Code</CodeLabel>
            <CodeDisplay onClick={copyToClipboard} title="Click to copy">
              {inviteCode || 'Generating...'}
              {isCopied && <span style={{
                marginLeft: '0.5rem',
                fontSize: '0.8rem',
                color: '#4ade80',
                opacity: isCopied ? 1 : 0,
                transition: 'opacity 0.3s ease'
              }}>Copied!</span>}
            </CodeDisplay>
          </InviteCode>
          <Title> Imposter Game</Title>
          <ViewContainer $isActive={!showThemes}>
            <Lobby onStartGame={() => setShowThemes(true)} />
          </ViewContainer>

          <ViewContainer $isActive={showThemes}>
            <Themes onBack={() => setShowThemes(false)} />
          </ViewContainer>
        </MainContainer>
      </PageContainer>
    </>
  );
}