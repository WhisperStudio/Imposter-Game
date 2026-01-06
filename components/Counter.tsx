"use client";

import { useState } from "react";

const Increment = (CurrentValue: any, SetValue: any, Max?: number) => {
    if (Max !== undefined && CurrentValue === Max) return;
    SetValue(CurrentValue + 1);
}

const Decrement = (CurrentValue: any, SetValue: any, Min?: number) => {
    if (Min !== undefined && CurrentValue === Min) return;
    SetValue(CurrentValue - 1);
}

const OnChange = (SetValue: any, e: React.ChangeEvent<HTMLInputElement>) => {
    const ChangedValue = e.target.value
    if (!/^-?\d*(\.\d*)?$/.test(ChangedValue)) return; // Makes it so we can only write numbers as input, including "-"

    SetValue(e.target.value);
}

const OnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;

    e.preventDefault();
    e.currentTarget.blur();
};

const OnBlur = (SetValue: any, e: React.ChangeEvent<HTMLInputElement>, Min?: number, Max?: number) => {
    let ChangedValue: number = parseInt(e.target.value);

    if (Min && ChangedValue < Min) ChangedValue = Min;
    if (Max && ChangedValue > Max) ChangedValue = Max;

    SetValue(ChangedValue || Min);
}

const Counter = ({ DefaultValue, Name, Min, Max }: { DefaultValue: number, Name: string, Min?: number, Max?: number }) => {
    const [ CurrentValue, SetValue ] = useState(DefaultValue || 0);

    return (
        <div className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-2">
            <button type="button" className="text-blue-500 text-xl" onClick={() => Decrement(CurrentValue, SetValue, Min)}>−</button>
            <input name={Name} className="text-white text-lg font-medium" min={Min} max={Max} value={CurrentValue} onKeyDown={ OnKeyDown } onChange={(e) => { OnChange(SetValue, e) }} onBlur={(e) => { OnBlur(SetValue, e, Min, Max) }} />
            <button type="button" className="text-blue-500 text-xl" onClick={() => Increment(CurrentValue, SetValue, Max)}>+</button>
        </div>
    );
}

export default Counter;