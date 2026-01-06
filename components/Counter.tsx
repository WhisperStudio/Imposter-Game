"use client";

import { ReactEventHandler, useState } from "react";

const Increment = (CurrentValue: any, SetValue: any, Max?: number) => {
    if (Max && CurrentValue == Max) return;
    SetValue(CurrentValue + 1);
}

const Decrement = (CurrentValue: any, SetValue: any, Min?: number) => {
    if (Min && CurrentValue == Min) return;
    SetValue(CurrentValue - 1);
}

const OnChange = (SetValue: any, e: React.ChangeEvent<HTMLInputElement>) => {
    const ChangedValue: number = parseInt(e.target.value);

    SetValue(e.target.value);
}

const OnBlur = (SetValue: any, e: React.ChangeEvent<HTMLInputElement>, Min?: number, Max?: number) => {
    const ChangedValue: number = parseInt(e.target.value);

    if (isNaN(Number(e.target.value)))
    if (Min && ChangedValue < Min) e.target.value = Min.toString();
    if (Max && ChangedValue > Max) e.target.value = Max.toString();

    console.log(e.target.value);
    SetValue(e.target.value);
}

const Counter = ({ DefaultValue, Name, Min, Max }: { DefaultValue: number, Name: string, Min?: number, Max?: number }) => {
    const [ CurrentValue, SetValue ] = useState(DefaultValue || 0);

    return (
        <div className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-2">
            <button type="button" className="text-blue-500 text-xl" onClick={() => Decrement(CurrentValue, SetValue, Min)}>−</button>
            <input className="text-white text-lg font-medium" min={Min} max={Max} value={CurrentValue} onChange={(e) => { OnChange(SetValue, e) }} onBlur={(e) => { OnBlur(SetValue, e, Min, Max) }} />
            <button type="button" className="text-blue-500 text-xl" onClick={() => Increment(CurrentValue, SetValue, Max)}>+</button>
        </div>
    );
}

export default Counter;