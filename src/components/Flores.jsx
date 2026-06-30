import React from 'react';
import { motion } from 'framer-motion';

export const FloatingFlower = ({ delay, x, y, size, img }) => (
  <motion.img
    src={img}
    initial={{ y: y, left: x }}
    animate={{ y: [y, y - 40, y], rotate: [0, 10, -10, 0] }}
    transition={{ duration: 6, repeat: Infinity, delay: delay, ease: "easeInOut" }}
    style={{ width: size, left: x, top: y }}
    className="absolute pointer-events-none opacity-60 z-0"
  />
);