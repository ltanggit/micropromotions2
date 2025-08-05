
// SLIDING PANEL
// 'use client';
// import { useState, useEffect } from 'react';

// export default function SlidingPanel() {
//   const [visible, setVisible] = useState(false);

//   useEffect(() => {
//     setTimeout(() => setVisible(true), 200); // delay for effect
//   }, []);

//   return (
//     <div
//       className={`
//         fixed top-0 right-0 h-screen w-64 bg-white shadow-lg transform transition-transform duration-700 ease-out
//         ${visible ? 'translate-x-0' : 'translate-x-full'}
//       `}
//     >
//       <p className="p-6">🎧 Welcome to SmashHaus</p>
//     </div>
//   );
// }

// ANIMATES ON HOVER
export default function OverlayHero() {
  return (
    <button className="bg-black text-white px-6 py-3 rounded-md transition-all duration-300 ease-in-out hover:scale-105 hover:bg-gray-900">
    Upload Track
    </button>
  );
}
