import { Scissors, Star, MapPin, Clock } from 'lucide-react';
import React from 'react';

export const floresData = [
  { id: 1, img: "/flor-cerezo.png", x: "5%", y: 150, size: "80px", d: 0 },
  { id: 2, img: "/tulipan.png", x: "85%", y: 100, size: "110px", d: 1.5 },
  { id: 3, img: "/hibisco.png", x: "75%", y: 650, size: "90px", d: 3 },
  { id: 4, img: "/flor-rosa.png", x: "10%", y: 750, size: "75px", d: 0.5 },
  { id: 5, img: "/flor-cerezo.png", x: "40%", y: 50, size: "50px", d: 4 },
  { id: 6, img: "/tulipan.png", x: "25%", y: 400, size: "60px", d: 2.5 },
  { id: 7, img: "/flor-rosa.png", x: "90%", y: 800, size: "85px", d: 1 },
];

export const serviciosData = [
  { id: 1, icon: <Scissors />, nombre: "Corte Signature", desc: "Técnica personalizada que realza tus rasgos faciales con precisión milimétrica.", precio: "45€" },
  { id: 2, icon: <Star />, nombre: "Color Artístico", desc: "Balayage, mechas y técnicas de coloración que crean dimensión y movimiento.", precio: "85€" },
  { id: 3, icon: <MapPin />, nombre: "Tratamiento Keratina", desc: "Alisado y nutrición profunda para un cabello sedoso y sin frizz durante meses.", precio: "150€" },
  { id: 4, icon: <Clock />, nombre: "Spa Capilar", desc: "Experiencia relajante con mascarillas premium y masaje craneal revitalizante.", precio: "60€" },
  { id: 5, icon: <Star />, nombre: "Extensiones Premium", desc: "Cabello 100% natural con técnicas invisibles para mayor volumen y longitud.", precio: "200€" },
  { id: 6, icon: <Scissors />, nombre: "Novias & Eventos", desc: "Peinados espectaculares para tu día especial con prueba incluida.", precio: "120€" },
];

export const equipoData = [
  { id: 1, nombre: "Sofía Martínez", cargo: "Directora Creativa", exp: "15 años de experiencia", frase: "El cabello es el marco del rostro, y mi misión es crear obras de arte.", color: "bg-orange-400", tags: ["Colorista", "Balayage"] },
  { id: 2, nombre: "Carlos Ruiz", cargo: "Estilista Senior", exp: "12 años de experiencia", frase: "Cada corte es único, como la personalidad de quien lo lleva.", color: "bg-pink-500", tags: ["Cortes", "Barbería"] },
  { id: 3, nombre: "Ana García", cargo: "Especialista Color", exp: "8 años de experiencia", frase: "El color perfecto transforma no solo tu look, sino tu confianza.", color: "bg-purple-500", tags: ["Fantasy", "Mechas"] }
];