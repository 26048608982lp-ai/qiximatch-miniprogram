import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Interest } from '../types';

interface ConstellationMapProps {
  interests: Interest[];
  onInterestSelect: (interest: Interest) => void;
  selectedInterests: Interest[];
}

const ConstellationMap: React.FC<ConstellationMapProps> = ({
  interests,
  onInterestSelect,
  selectedInterests
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredInterest, setHoveredInterest] = useState<Interest | null>(null);
  
  const getPosition = useCallback((interestId: string): {x: number, y: number} => {
    const index = interests.findIndex(i => i.id === interestId);
    const angle = (index / interests.length) * 2 * Math.PI;
    const radius = 150;
    
    return {
      x: 250 + Math.cos(angle) * radius,
      y: 200 + Math.sin(angle) * radius
    };
  }, [interests]);

  const drawConstellation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 绘制连线
    selectedInterests.forEach((interest, index) => {
      if (index < selectedInterests.length - 1) {
        const nextInterest = selectedInterests[index + 1];
        const fromPos = getPosition(interest.id);
        const toPos = getPosition(nextInterest.id);
        
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.strokeStyle = `rgba(255, 255, 255, 0.7)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // 如果有悬停的兴趣，绘制到所有选中兴趣的连线
    if (hoveredInterest && !selectedInterests.includes(hoveredInterest)) {
      selectedInterests.forEach(interest => {
        const fromPos = getPosition(hoveredInterest.id);
        const toPos = getPosition(interest.id);
        
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    // 绘制兴趣点
    interests.forEach(interest => {
      const pos = getPosition(interest.id);
      const isSelected = selectedInterests.some(selected => selected.id === interest.id);
      const isHovered = hoveredInterest?.id === interest.id;

      ctx.beginPath();
      
      // 绘制五角星
      for (let i = 0; i < 5; i++) {
        const angle = (i * 144 - 90) * Math.PI / 180;
        const x = pos.x + Math.cos(angle) * (isSelected ? 25 : 20);
        const y = pos.y + Math.sin(angle) * (isSelected ? 25 : 20);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();
      
      // 设置颜色和样式
      if (isSelected) {
        ctx.fillStyle = '#ffe66d';
        ctx.strokeStyle = '#ff6b9d';
        ctx.lineWidth = 3;
      } else if (isHovered) {
        ctx.fillStyle = '#4ecdc4';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#c44569';
        ctx.lineWidth = 2;
      }
      
      ctx.fill();
      ctx.stroke();

      // 绘制文字
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(interest.name, pos.x, pos.y + 40);
    });
  }, [interests, selectedInterests, hoveredInterest, getPosition]);

  useEffect(() => {
    drawConstellation();
  }, [drawConstellation]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 查找点击的兴趣点
    interests.forEach(interest => {
      const pos = getPosition(interest.id);
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      
      if (distance <= 25) {
        onInterestSelect(interest);
      }
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 查找悬停的兴趣点
    let found = false;
    interests.forEach(interest => {
      const pos = getPosition(interest.id);
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      
      if (distance <= 25) {
        setHoveredInterest(interest);
        found = true;
      }
    });

    if (!found) {
      setHoveredInterest(null);
    }
  };

  return (
    <div className="relative w-full h-96 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={500}
        height={400}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={() => setHoveredInterest(null)}
        className="cursor-pointer border border-white/20 rounded-lg"
      />
      
      <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-lg">
        <p className="text-sm">点击星星选择兴趣</p>
        <p className="text-xs opacity-75">已选择: {selectedInterests.length}</p>
      </div>
    </div>
  );
};

export default ConstellationMap;