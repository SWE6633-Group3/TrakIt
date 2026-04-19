import {
    AlertCircle, AlertTriangle, Info,
    CircleDot, Activity, CheckCircle2,
    LucideIcon
} from 'lucide-react';

// Color code text based on risk impact/status
export const getRiskColor = (statusText: string | undefined): string => {
    // Make case-insensitive
    const normalizedStatus = statusText?.toLowerCase() || '';

    // Map text values to colors
    const colorMap: Record<string, string> = {
        // Impact Levels
        high: 'text-red-600 dark:text-red-400',
        medium: 'text-orange-500 dark:text-orange-400',
        low: 'text-slate-500 dark:text-slate-400',

        // Status Levels
        open: 'text-green-600 dark:text-green-400',
        monitoring: 'text-amber-500 dark:text-amber-400',
        closed: 'text-blue-600 dark:text-blue-400',
    };

    // Default to slate gray if no match found
    return colorMap[normalizedStatus] || 'text-slate-500 dark:text-slate-400';
};

// Add icon based on risk impact/status
export const getRiskIcon = (statusText: string | undefined): LucideIcon => {
    // Make case-insensitive
    const normalizedStatus = statusText?.toLowerCase() || '';

    // Map text values to icons
    const iconMap: Record<string, LucideIcon> = {
        // Impact Levels
        high: AlertCircle,
        medium: AlertTriangle,
        low: Info,

        // Status Levels
        open: CircleDot,
        monitoring: Activity,
        closed: CheckCircle2,
    };

    return iconMap[normalizedStatus] || Info;
};