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
            // Adjust coordinates if needed, but passing raw canvas coords is best
            // If caller passes relative coords (0-1), multiply by width/height
            // For now assume caller sends pixel coords or we handle logic here.
            // Let's stick to pixel coords or relative. 
            // Better: relative (0 to 1) so it scales.

            const canvas = canvasRef.current;
            if (!canvas) return;

            // Check if x,y are normalized (0-1) or absolute.
            // If < 2, assume normalized.
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
            // Gradient Background mimicking original theme but on canvas if needed
            // Or just clear and let CSS bg show?
            // User requested "use this animation" -> fillStyle = '#00baff'
            // But strict adherence might kill the "Night Mode" vibe of the app.
            // Compromise: Use a dark blue semi-transparent fill to create trails/water effect,
            // OR transparent background with just ripples.
            // Let's try transparent first to keep the nice sky/stars.

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Ripples
            // Logic adapted from snippet: radius += speed, fade out.
            const maxRadius = Math.max(canvas.width, canvas.height) / 2;
            const speed = 2; // Slower for calm sea? Snippet used maxRadius / 40 which is fast.

            for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
                const ripple = ripplesRef.current[i];
                ripple.radius += speed;
                ripple.alpha = 1 - (ripple.radius / maxRadius);

                if (ripple.alpha <= 0) {
                    ripplesRef.current.splice(i, 1);
                    continue;
                }

                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(100, 200, 255, ${ripple.alpha * 0.3})`; // Light blue, semi-transparent
                ctx.fill();
                ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.alpha * 0.5})`; // White ring
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    // Handle clicks for fun/testing
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
        <div className="absolute inset-0 z-0 overflow-hidden bg-gradient-to-b from-[#001f33] to-[#000510]">
            {/* Keeping Sky/Stars mostly because it looks good, but reducing prominence to focus on water */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(20,50,100,0.3),transparent_70%)]"></div>

            <canvas
                ref={canvasRef}
                onClick={handleClick}
                className="absolute inset-0 w-full h-full z-10 cursor-pointer"
            />
        </div>
    )
});

OceanBackground.displayName = "OceanBackground";
