import React from 'react';

interface SparklineProps {
    data: number[];
    color: string;
    width?: number;
    height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({ data, color, width = 100, height = 30 }) => {
    if (!data || data.length === 0) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;

    // Normalize data points to fit within SVG bounds
    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        // Padding top and bottom to ensure stroke doesn't get cut off
        const padding = height * 0.1;
        const availableHeight = height - (padding * 2);
        const y = height - padding - (range === 0 ? availableHeight / 2 : ((value - min) / range) * availableHeight);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                // Add a subtle drop shadow
                filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.3))"
            />
        </svg>
    );
};
