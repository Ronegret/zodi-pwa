const fs = require('fs');
let content = fs.readFileSync('components/ZodiOracle.tsx', 'utf8');

const target1 = `import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";`;

const replacement1 = `import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getLocalSession } from "@/lib/session";
import { getGems, spendGems } from "@/lib/gamification";`;

const target2 = `  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    // TODO: Conectar a API Real (/api/chat) que valide tokens/gemas
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "zodi", text: "El universo está ocupado, pero sí... probablemente sea tu culpa. Inténtalo con más ganas o compra Gemas." }]);
      setLoading(false);
    }, 1500);
  };`;

const replacement2 = `  const handleSend = async () => {
    if (!input.trim()) return;
    
    const session = getLocalSession();
    if (!session.uid) {
      alert("Debes iniciar sesión para consultar al oráculo.");
      return;
    }

    // Check Daily Energy or Gems
    const today = new Date().toISOString().split('T')[0];
    const lastDaily = localStorage.getItem('zodi.daily_oracle_used');
    let hasDaily = lastDaily !== today;
    
    if (!hasDaily) {
      // Must use Gems (cost: 5 gems per question)
      const currentGems = getGems().total;
      if (currentGems < 5) {
        alert("Te has quedado sin energía libre y no tienes suficientes gemas (Cuesta 5). Ve a la tienda a comprar más Gemas.");
        return;
      }
      spendGems(5);
    } else {
      localStorage.setItem('zodi.daily_oracle_used', today);
    }

    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user" as const, text: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Slice history to the last 4 messages to save tokens
      const historyToKeep = newMessages.slice(-4);
      
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: historyToKeep,
          userProfile: session.astralProfile || { sunSign: "Desconocido" }
        })
      });
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: "zodi", text: data.text }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "zodi", text: "Error de red cósmico. Se me ha caído la bola de cristal." }]);
    } finally {
      setLoading(false);
    }
  };`;

content = content.replace(target1, replacement1);
// Due to the encoding reading issues from powershell, I'll use regex for handleSend replacement
// Or I can just write the whole file since it's small.
