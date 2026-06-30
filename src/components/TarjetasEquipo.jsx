import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const TarjetaEquipo = ({ persona }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // 1. Armamos los datos seguros para que no explote
  const nombreCompleto = `${persona.nombre} ${persona.apellido || ''}`;
  const especialidad = persona.especialidad || 'Estilista Profesional';
  
  // 2. Inventamos una frase y tags genéricos, ya que MySQL no tiene esas columnas
  const frase = `"Dedicada a resaltar tu mejor versión con técnicas de ${especialidad.toLowerCase()}."`;
  const tagsFallback = ["Belleza", "Estilo", "Dedicación"];

  return (
    <div 
      className="relative w-full h-[400px] cursor-pointer" 
      onMouseEnter={() => setIsFlipped(true)} 
      onMouseLeave={() => setIsFlipped(false)}
    >
      <motion.div 
        className="w-full h-full relative" 
        animate={{ rotateY: isFlipped ? 180 : 0 }} 
        transition={{ duration: 0.6 }} 
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* CARA FRONTAL */}
        <div className="card-flip-front" style={{ backfaceVisibility: "hidden" }}>
          <div className="relative w-32 h-32 mb-6">
            <div className="absolute inset-0 bg-[#f171ab] rounded-full blur-2xl opacity-40"></div>
            <div className="relative w-full h-full bg-gray-200 rounded-full border-4 border-white overflow-hidden shadow-lg flex items-center justify-center text-4xl">
              👤
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{nombreCompleto}</h3>
          {/* Aquí reutilizamos tu clase section-subtitle */}
          <p className="section-subtitle mt-2">
            {especialidad}
          </p>
        </div>

        {/* CARA TRASERA */}
        <div className="card-flip-back" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <p className="text-white italic text-lg mb-6 leading-relaxed">
            {frase}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {tagsFallback.map(tag => (
              <span key={tag} className="tag-equipo">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};