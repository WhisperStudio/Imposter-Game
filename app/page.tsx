"use client";

import Image from "next/image";
import { useState } from 'react';
import React from "react";
import PlayButton from "@/components/PlayButton";
import Counter from "@/components/Counter";
import Themes from "@/components/Themes";
import styled from 'styled-components';



const StyledSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
`;
const SectionTitle = styled.div`
  color: #18181b;  /* Samme som text-zinc-900 */
  font-size: 0.875rem; /* 14px - samme som text-sm */
  margin-bottom: 0.5rem; /* samme som mb-2 */
  width: 100%;
`;


export default function Home() {
  const [ PlayersValue, SetPlayersValue ] = useState<string>("3");
  const [ ImpostersValue, SetImpostersValue ] = useState<string>("1");

  const PlayerHardMin: number = -3, PlayerHardMax: number = 20;
  const ImposterHardMin: number = 1, ImposterHardMax: number = PlayerHardMax - 1;

  const [ImposterSoftMax, SetImposterSoftMax] = useState<number>(Number(PlayersValue) - 1);

  useEffect(() => {
    const Players = Number(PlayersValue);

    SetImposterSoftMax(Number(PlayersValue) - 1);

    console.log("Players:", Players, ",", PlayersValue);
    console.log("SoftMax:", ImposterSoftMax);
  }, [PlayersValue, ImpostersValue]);

  const HandleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const numPlayers = formData.get("numPlayers");
    console.log(numPlayers);
  }



  return (
    <div className="
      flex
      min-h-screen
      bg-linear-to-br
      from-red
      to-zinc-900
      items-center
      justify-center
      p-4">
      <div className="w-full max-w-md md:max-w-4xl">
        <form onSubmit={ HandleSubmit } className="bg-zinc-900/90 rounded-3xl shadow-2xl p-6 md:p-10">
          <h1 className="text-white text-3xl md:text-4xl font-semibold text-center mb-8">
            Imposter Game
          </h1>

          {/* Top controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Section title="Number of Players">
              <Counter Count={PlayersValue} SetCount={SetPlayersValue} Name="numPlayers" HardMin={PlayerHardMin} HardMax={PlayerHardMax} />
            </Section>

            <Section title="Number of Imposters">
              <Counter Count={ImpostersValue} SetCount={SetImpostersValue} Name="numImposters" HardMin={ImposterHardMin} HardMax={ImposterHardMax} SoftMax={ImposterSoftMax} />
            </Section>
          </div>

          <Themes />

          <div className="flex justify-center">
            <PlayButton />
          </div>
        </form>
      </div>
    </div>
  );
}


function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <StyledSection>
      <SectionTitle>{title}</SectionTitle>
      {children}
    </StyledSection>
  );
}