import React from 'react';
import LightRays from '../ui/LightRays';

interface OpenerPageProps {
  onGetStarted: () => void;
}

export const OpenerPage: React.FC<OpenerPageProps> = ({ onGetStarted }) => {
  return (
    <>
      <style>{`
        @keyframes gentle-pulse {
          0%, 100% {
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 25px rgba(255, 255, 255, 0.7);
          }
        }
        
        @keyframes soft-glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.02);
          }
        }
      `}</style>
      
      <div className="min-h-screen flex flex-col justify-between items-center px-6 py-12 bg-[#242331] text-[#122D40]">
      <div className="absolute inset-0">
        <LightRays
          raysOrigin="top-center"
          raysColor="#00000"
          raysSpeed={1.5}
          lightSpread={0.2}
          rayLength={2.4}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
          className="custom-rays"
        />
      </div>
      {/* title */}
      <div className="flex-1 flex items-center justify-center -mt-40">
        <img 
          //src="https://archive.org/download/gearupfinal/gearupfinal.gif"
          //src="https://cdn.jsdelivr.net/gh/kishangoli/ourMini/src/gearup.gif"
          src="/gearupfinal.gif"
          alt="Gear Up Logo" 
          className="h-90 w-auto" 
        />
      </div>

      {/* get started button */}
      <div className="w-full">
        <p className="text-gray-400 text-center text-base mb-4 px-6">
          Your personal fitness journey starts here.
        </p>
        <div className="relative">
          <button
            onClick={onGetStarted}
            className="w-full h-16 rounded-full bg-transparent text-white font-semibold text-xl
                      border border-white relative overflow-hidden
                      hover:bg-white/10 transition-all duration-300 ease-out
                      shadow-[0_0_15px_rgba(255,255,255,0.4)]
                      hover:shadow-[0_0_25px_rgba(255,255,255,0.6)]"
            style={{
              animation: 'gentle-pulse 3s ease-in-out infinite'
            }}
          >
            <div 
              className="absolute inset-0 rounded-full bg-white/8" 
              style={{
                animation: 'soft-glow 4s ease-in-out infinite'
              }}
            ></div>
            <span className="relative z-10">Get Started</span>
          </button>
        </div>
      </div>
    </div>
    </>
  );
};
