import React from 'react';

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
      
      <div className="min-h-screen flex flex-col justify-between items-center px-6 py-12 bg-[#242331] text-[#122D40] relative">
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/running.mp4" type="video/mp4" />
        </video>
        
        {/* Translucent Overlay */}
        <div className="absolute inset-0 bg-black/50 z-10"></div>
        
        {/* title */}
        <div className="flex-1 flex items-center justify-center -mt-40 relative z-30">
          <img 
            //src="https://archive.org/download/gearupfinal/gearupfinal.gif"
            //src="https://cdn.jsdelivr.net/gh/kishangoli/ourMini/src/gearup.gif"
            src="/gearupfinal.gif"
            alt="Gear Up Logo" 
            className="h-90 w-auto" 
          />
        </div>

        {/* get started button */}
        <div className="w-full relative z-30">
        <p className="text-gray-400 text-center text-base mb-8 px-2">
          Tell us your goals. We'll curate personalized gear, nutrition, and recovery picks.
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
