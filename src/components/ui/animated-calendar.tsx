'use client';

import { motion, useMotionValue, useSpring, type SpringOptions } from 'framer-motion';
import { useRef } from 'react';

const springConfig: SpringOptions = {
  damping: 30,
  stiffness: 100,
  mass: 2,
};

export function AnimatedCalendar() {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, springConfig);
  const rotateY = useSpring(0, springConfig);
  const scale = useSpring(1, springConfig);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateYValue = ((e.clientX - centerX) / (rect.width / 2)) * 10;
    const rotateXValue = ((e.clientY - centerY) / (rect.height / 2)) * -10;
    rotateX.set(rotateXValue);
    rotateY.set(rotateYValue);
  }

  return (
    <motion.div
      ref={ref}
      className="w-[300px] h-[350px] relative [perspective:800px]"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => scale.set(1.05)}
      onMouseLeave={() => {
        scale.set(1);
        rotateX.set(0);
        rotateY.set(0);
      }}
    >
      <motion.div
        className="w-full h-full [transform-style:preserve-3d]"
        style={{ rotateX, rotateY, scale }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#011936] to-[#0A2F5E] rounded-2xl shadow-xl">
          {/* Calendar Header */}
          <div className="bg-[#C2EABD]/20 backdrop-blur-sm p-4 rounded-t-2xl border-b border-[#C2EABD]/20">
            <div className="text-[#C2EABD] font-semibold text-lg text-center">
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 p-4">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
              <div key={day} className="text-[#C2EABD]/80 text-center text-sm font-medium">
                {day}
              </div>
            ))}
            {Array.from({ length: 31 }, (_, i) => (
              <motion.div
                key={i}
                className="aspect-square flex items-center justify-center"
                whileHover={{ scale: 1.2, color: '#C2EABD' }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
              >
                <span className="text-[#C2EABD]/90 text-sm">{i + 1}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 