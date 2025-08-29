import React from 'react';
import { Button } from "../ui/moving-border";
import LightRays from '../ui/LightRays';

interface OpenerPageProps {
  onGetStarted: () => void;
}

export const OpenerPage: React.FC<OpenerPageProps> = ({ onGetStarted }) => {
  return (
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
        <Button
          onClick={onGetStarted}
          borderRadius="9999px"
          duration={4000}
          containerClassName="h-16 p-[0.4px] w-full"
          borderClassName="h-16 w-16 opacity-90 bg-[radial-gradient(#ffffff_45%,transparent_46%)] drop-shadow-[0_0_10px_rgba(255,255,255,0.85)]"
          className="rounded-full bg-transparent text-white font-semibold text-xl
                    hover:bg-white/10 transition-all duration-200
                    border border-white"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};
