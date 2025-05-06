"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export const CanvasRevealEffect = ({
    colors = [[255, 255, 255]],
    dotSize = 1,
    animationSpeed = 10,
    containerClassName,
}: {
    colors?: number[][];
    dotSize?: number;
    animationSpeed?: number;
    containerClassName?: string;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            color: number[];
        }> = [];

        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (!parent) return;

            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        };

        const createParticles = () => {
            particles = [];
            const numberOfParticles = 100;

            for (let i = 0; i < numberOfParticles; i++) {
                const color = colors[Math.floor(Math.random() * colors.length)];
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * animationSpeed,
                    vy: (Math.random() - 0.5) * animationSpeed,
                    color,
                });
            }
        };

        const drawParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((particle) => {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, dotSize, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${particle.color.join(",")}, 0.5)`;
                ctx.fill();

                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Bounce off walls
                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
            });

            animationFrameId = requestAnimationFrame(drawParticles);
        };

        resizeCanvas();
        createParticles();
        drawParticles();

        window.addEventListener("resize", () => {
            resizeCanvas();
            createParticles();
        });

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", resizeCanvas);
        };
    }, [colors, dotSize, animationSpeed]);

    return (
        <div className={cn("w-full h-full relative", containerClassName)}>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />
        </div>
    );
}; 