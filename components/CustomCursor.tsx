
import React, { useEffect, useRef } from 'react';

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run on desktop
    const isMobile = window.matchMedia("(max-width: 1024px)").matches;
    if (isMobile) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    let mouseX = -100;
    let mouseY = -100;
    let cursorX = -100;
    let cursorY = -100;

    // Smooth lerp factor (0.1 = slower/smoother, 1 = instant)
    // The original CSS used transition: width/height/bg, but position is usually instant 
    // or slightly lagged in JS implementations. 
    // We will use direct assignment for instant responsiveness like the CSS version,
    // but we can add a tiny bit of lerp if requested. 
    // The original CSS provided was: transform: translate(-50%, -50%);
    // and updated left/top via JS.
    
    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      // Direct update for zero latency (matches original CSS feel)
      cursor.style.left = `${mouseX}px`;
      cursor.style.top = `${mouseY}px`;
      
      // Random Note Logic
      if (Math.random() < 0.02) {
        createFallingNote(mouseX, mouseY);
      }
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check interactive elements
      const isInteractive = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('a') || 
        target.closest('button') || 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' ||
        target.classList.contains('data-hover');

      if (isInteractive) {
        cursor.classList.add('hovered');
      } else {
        cursor.classList.remove('hovered');
      }
    };

    const createFallingNote = (x: number, y: number) => {
      const note = document.createElement('div');
      note.innerText = Math.random() > 0.5 ? '♪' : '♫';
      note.style.position = 'fixed';
      note.style.left = `${x}px`;
      note.style.top = `${y}px`;
      note.style.color = 'white';
      note.style.fontSize = '1.2rem';
      note.style.pointerEvents = 'none';
      note.style.zIndex = '9998';
      note.style.marginLeft = `${(Math.random() * 20 - 10)}px`;
      note.style.fontFamily = 'Arial, sans-serif';
      // Inline animation
      note.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: 'translateY(100px) rotate(45deg)', opacity: 0 }
      ], {
        duration: 1500,
        easing: 'linear',
        fill: 'forwards'
      });
      
      document.body.appendChild(note);
      setTimeout(() => note.remove(), 1500);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseover', onMouseOver);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      // Clean up any stray notes? They remove themselves.
    };
  }, []);

  return (
    <>
      <style>{`
        #custom-cursor {
          position: fixed;
          top: 0; left: 0;
          width: 20px; height: 20px;
          border: 1px solid white;
          border-radius: 50%;
          pointer-events: none;
          z-index: 10000;
          transform: translate(-50%, -50%);
          transition: width 0.3s, height 0.3s, background-color 0.3s, opacity 0.3s;
          mix-blend-mode: difference;
        }
        #custom-cursor.hovered {
          width: 60px; height: 60px;
          background-color: white;
          border-color: transparent;
          opacity: 0.9;
        }
        /* Mobile hide */
        @media (max-width: 1024px) {
          #custom-cursor { display: none; }
        }
      `}</style>
      <div id="custom-cursor" ref={cursorRef}></div>
    </>
  );
};

export default CustomCursor;
