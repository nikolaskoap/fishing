'use client'

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'

export interface OceanBackgroundRef {
    triggerRipple: (x: number, y: number) => void;
}

export const OceanBackground = forwardRef<OceanBackgroundRef, {}>((props, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ripplesRef = useRef<Array<{ x: number, y: number, radius: number, alpha: number }>>([]);
    const animationRef = useRef<number>();

    // Expose trigger method
    useImperativeHandle(ref, () => ({
        triggerRipple: (x: number, y: number) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const finalX = x < 2 ? x * canvas.width : x;
            const finalY = y < 2 ? y * canvas.height : y;

            ripplesRef.current.push({
                x: finalX,
                y: finalY,
                radius: 0,
                alpha: 1
            });
        }
    }));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize handler
        const resize = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }
        };

        window.addEventListener('resize', resize);
        resize();

        // Animation Loop
        const animate = () => {
            // Bright Blue Background
            ctx.fillStyle = '#00baff'; // Brighter cyan/blue
            ctx.fillRect(0, 0, canvas.width, canvas.height); // Use fillRect instead of clearRect to set bg

            // Draw Ripples
            const maxRadius = Math.max(canvas.width, canvas.height);
            const speed = maxRadius / 80;

            for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
                const ripple = ripplesRef.current[i];
                ripple.radius += speed;
                // Fade out logic: (1 - r/max) * 0.8
                ripple.alpha = (1 - ripple.radius / maxRadius) * 0.8;

                if (ripple.alpha <= 0) {
                    ripplesRef.current.splice(i, 1);
                    continue;
                }

                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${ripple.alpha})`; // White ripples
                ctx.fill();
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ripplesRef.current.push({
            x,
            y,
            radius: 0,
            alpha: 1
        });
    };

    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#00baff]">
            <canvas
                ref={canvasRef}
                onClick={handleClick}
                className="absolute inset-0 w-full h-full z-10 cursor-pointer"
            />
        </div>
    )
});

OceanBackground.displayName = "OceanBackground";
