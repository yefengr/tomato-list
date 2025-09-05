import React, { useState, useEffect } from 'react';
import type { Settings } from '../types';
import { ArrowLeftIcon } from './icons';

interface SettingsPageProps {
  currentSettings: Settings;
  onSave: (newSettings: Settings) => void;
  onBack: () => void;
  defaultSettings: Settings;
}

const SettingsInput: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    unit: string;
}> = ({ label, value, onChange, min = 1, max = 120, unit }) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let numValue = parseInt(e.target.value, 10);
        if (isNaN(numValue)) numValue = min;
        if (numValue < min) numValue = min;
        if (numValue > max) numValue = max;
        onChange(numValue);
    };

    const increment = () => onChange(Math.min(max, value + 1));
    const decrement = () => onChange(Math.max(min, value - 1));

    return (
        <div>
            <label className="block text-md font-medium text-slate-700 dark:text-slate-300 mb-2">
                {label}
            </label>
            <div className="relative flex items-center">
                <button onClick={decrement} className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded-l-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">-</button>
                <input
                    type="number"
                    value={value}
                    onChange={handleChange}
                    min={min}
                    max={max}
                    className="w-full text-center bg-white dark:bg-slate-800 border-y border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-lg py-2"
                />
                 <span className="absolute right-14 text-slate-400 dark:text-slate-500 pointer-events-none">{unit}</span>
                <button onClick={increment} className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded-r-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">+</button>
            </div>
        </div>
    );
};


const SettingsPage: React.FC<SettingsPageProps> = ({ currentSettings, onSave, onBack, defaultSettings }) => {
    const [settings, setSettings] = useState(currentSettings);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setSettings(currentSettings);
    }, [currentSettings]);

    const handleSave = () => {
        onSave(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000); // show saved message for 2 seconds
    };

    const handleReset = () => {
        setSettings(defaultSettings);
    };

    const updateSetting = (key: keyof Settings, value: number) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="w-full max-w-2xl mx-auto animate-fadeIn">
            <header className="flex items-center mb-6">
                <button 
                    onClick={onBack} 
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors mr-4"
                    aria-label="返回"
                >
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    系统设置
                </h1>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 sm:p-8 space-y-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-3">番茄钟配置</h2>
                
                <SettingsInput
                    label="番茄时长"
                    value={settings.pomodoroDuration}
                    onChange={(val) => updateSetting('pomodoroDuration', val)}
                    unit="分钟"
                />
                
                <SettingsInput
                    label="短休息时长"
                    value={settings.shortBreakDuration}
                    onChange={(val) => updateSetting('shortBreakDuration', val)}
                    unit="分钟"
                />

                <SettingsInput
                    label="长休息时长"
                    value={settings.longBreakDuration}
                    onChange={(val) => updateSetting('longBreakDuration', val)}
                    unit="分钟"
                />
                
                 <SettingsInput
                    label="长休息间隔"
                    value={settings.longBreakInterval}
                    onChange={(val) => updateSetting('longBreakInterval', val)}
                    min={2}
                    max={10}
                    unit="个番茄"
                />
            </div>
            
            <footer className="mt-8 flex items-center justify-end space-x-4">
                 <button 
                    onClick={handleReset} 
                    className="px-6 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                    恢复默认值
                </button>
                 <button 
                    onClick={handleSave} 
                    className="relative px-6 py-2 rounded-lg text-sm bg-violet-600 text-white hover:bg-violet-700 transition-colors font-semibold"
                >
                    {saved ? '已保存!' : '保存设置'}
                </button>
            </footer>
        </div>
    );
};

export default SettingsPage;
