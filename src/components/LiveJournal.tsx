import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Square, Loader2, X, Camera, CameraOff } from 'lucide-react';
import { useLiveAPI } from '../hooks/useLiveAPI';

interface LiveJournalProps {
  key?: string;
  onFinish: (transcript: { role: string; text: string }[]) => void;
  onCancel: () => void;
}

export function LiveJournal({ onFinish, onCancel }: LiveJournalProps) {
  const apiKey = process.env.GEMINI_API_KEY || '';
  const { isConnected, connect, disconnect, transcript, videoRef, shouldFinish, isCameraOn, isMicOn, toggleCamera, toggleMic } = useLiveAPI(apiKey);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    connect().then(() => setIsConnecting(false));
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    if (shouldFinish) {
      handleFinish();
    }
  }, [shouldFinish]);

  const handleFinish = () => {
    disconnect();
    onFinish(transcript);
  };

  const handleCancel = () => {
    disconnect();
    onCancel();
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full max-w-4xl">
      {/* Ideas Panel */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-64 bg-amber-50 rounded-3xl p-6 shadow-xl border-4 border-amber-100 order-2 md:order-1"
      >
        <h3 className="font-bold text-amber-800 mb-4 text-xl">💡 Ideas to share!</h3>
        <ul className="space-y-4 text-amber-700 font-medium text-lg">
          <li className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm"><span className="text-3xl">🎨</span> Show a drawing</li>
          <li className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm"><span className="text-3xl">🧸</span> Show a toy</li>
          <li className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm"><span className="text-3xl">🏃</span> Talk about a game</li>
          <li className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm"><span className="text-3xl">🍎</span> What did you eat?</li>
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center relative order-1 md:order-2 border-8 border-indigo-50"
      >
        <button 
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-20"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <img 
            src="https://api.dicebear.com/7.x/bottts/svg?seed=magicJournal&backgroundColor=c0aede" 
            alt="AI Companion" 
            className="w-16 h-16 rounded-full border-4 border-indigo-100 shadow-sm bg-indigo-50"
          />
          <h2 className="text-2xl font-bold text-gray-900">Listening...</h2>
        </div>

        <div className="relative w-64 h-64 mb-8 rounded-3xl overflow-hidden bg-indigo-100 shadow-inner flex items-center justify-center border-4 border-indigo-50">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`absolute inset-0 w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`}
        />
        {!isCameraOn && (
          <div className="absolute inset-0 bg-indigo-200 flex items-center justify-center">
            <CameraOff className="w-16 h-16 text-indigo-400" />
          </div>
        )}
        {isConnecting ? (
          <div className="absolute inset-0 bg-indigo-100/80 flex items-center justify-center backdrop-blur-sm z-10">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="absolute bottom-4 right-4 z-10 flex gap-2">
            <button
              onClick={toggleCamera}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${isCameraOn ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-gray-500 hover:bg-gray-600'}`}
            >
              {isCameraOn ? <Camera className="w-6 h-6 text-white" /> : <CameraOff className="w-6 h-6 text-white" />}
            </button>
            <button
              onClick={toggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${isMicOn ? 'bg-rose-500 hover:bg-rose-600' : 'bg-gray-500 hover:bg-gray-600'}`}
            >
              {isMicOn ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Mic className="w-6 h-6 text-white" />
                </motion.div>
              ) : (
                <MicOff className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        )}
      </div>

      <p className="text-gray-600 text-center mb-8 h-12">
        {isConnecting ? "Connecting to magic..." : "Show me your drawings or toys, and tell me about your day!"}
      </p>

      <button
        onClick={handleFinish}
        disabled={isConnecting}
        className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 text-lg"
      >
        <Square className="w-5 h-5 fill-current" />
        Finish & Create Story
      </button>
    </motion.div>
    </div>
  );
}
