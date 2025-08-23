import React, { useState, useRef, useEffect } from 'react';

interface DraggableProps {
  children: React.ReactNode;
  containerWidth: number;
  containerHeight: number;
  initialX: number; // Initial X position of the card
  initialY: number; // Initial Y position of the card
  onPositionChange?: (x: number, y: number) => void;
}

const Draggable: React.FC<DraggableProps> = ({ children, containerWidth, containerHeight, initialX, initialY, onPositionChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: initialX, y: initialY }); // Start from initial positions
  const dragStartPos = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = Math.max(0, Math.min(containerWidth - cardRef.current!.offsetWidth, e.clientX - dragStartPos.current.x));
    const newY = Math.max(0, Math.min(containerHeight - cardRef.current!.offsetHeight, e.clientY - dragStartPos.current.y));

    setPosition({ x: newX, y: newY });

    if(onPositionChange)
      onPositionChange(newX, newY);
    
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
  };

  useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={cardRef}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        cursor: 'grab',
        border: '1px solid rgba(0, 0, 0, 0.0)',
        padding: '0px',
        borderRadius: '0px',
        backgroundColor: 'rgba(0, 0, 0, 0.0)',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
      }}
      onMouseDown={handleMouseDown}

    >
      {children}
    </div>
  );
};
export default Draggable;