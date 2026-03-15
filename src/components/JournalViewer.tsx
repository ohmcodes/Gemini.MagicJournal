import { motion } from 'motion/react';
import { BookOpen, ArrowLeft, Sparkles } from 'lucide-react';
import { JournalData } from '../App';

export function JournalViewer({ journal, onClose }: { key?: string, journal: JournalData, onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl w-full bg-amber-50 rounded-3xl shadow-2xl overflow-hidden border-8 border-amber-100"
    >
      <div className="bg-amber-100 p-4 flex items-center justify-between border-b-4 border-amber-200">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-amber-800 hover:text-amber-900 font-medium transition-colors bg-white/50 hover:bg-white/80 px-4 py-2 rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Bookshelf
        </button>
        <div className="flex items-center gap-2 text-amber-800 font-bold text-lg">
          <BookOpen className="w-6 h-6" />
          {journal.date}
        </div>
        <div className="w-32"></div>
      </div>

      <div className="p-8 md:p-12 flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-1/2 flex flex-col gap-6">
          <div className="aspect-square rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-white">
            <img
              src={journal.imageUrl}
              alt="Journal Illustration"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-amber-100">
            <h3 className="text-xl font-bold text-amber-800 mb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Today's Log
            </h3>
            <p className="text-gray-700 font-medium leading-relaxed">
              {journal.journal}
            </p>
          </div>
        </div>
        
        <div className="w-full md:w-1/2 bg-white p-8 rounded-3xl shadow-sm border-2 border-amber-100">
          <h3 className="text-2xl font-bold text-indigo-800 mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" /> Magical Adventure
          </h3>
          <div className="prose prose-amber prose-lg">
            {journal.story.split('\n\n').map((paragraph: string, index: number) => (
              <p key={index} className="text-gray-800 font-serif leading-relaxed mb-4 text-lg">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
