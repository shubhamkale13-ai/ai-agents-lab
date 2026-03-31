import React from 'react'
import { motion } from 'framer-motion'

export default function Aurora({ isThinking }) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        className="aurora-blob w-[700px] h-[700px]"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', top: -300, left: -200 }}
        animate={{ x: isThinking ? [0,80,0] : [0,40,0], y: [0,30,0] }}
        transition={{ duration: isThinking ? 7 : 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="aurora-blob w-[600px] h-[600px]"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)', bottom: -250, right: -150 }}
        animate={{ x: [0,-40,0], y: [0,-30,0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="aurora-blob w-[400px] h-[400px]"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)', top: '45%', left: '50%', transform: 'translate(-50%,-50%)' }}
        animate={{ scale: isThinking ? [1,1.4,1] : [1,1.1,1] }}
        transition={{ duration: isThinking ? 5 : 20, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
