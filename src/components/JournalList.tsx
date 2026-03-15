import { motion } from 'motion/react';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { JournalData } from '../App';

interface JournalListProps {
  key?: string;
  journals: JournalData[];
  onBack: () => void;
  onSelect: (journal: JournalData) => void;
}

export function JournalList({ journals, onBack, onSelect }: JournalListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl w-full bg-white rounded-3xl shadow-xl p-8"
    >
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back Home
        </button>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-indigo-600" /> My Bookshelf
        </h2>
        <div className="w-24"></div> {/* Spacer for centering */}
      </div>

      {journals.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl mb-4">Your bookshelf is empty!</p>
          <p>Start a new journal to fill it with magical stories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {journals.map((journal) => (
            <div 
              key={journal.id}
              onClick={() => onSelect(journal)}
              className="bg-amber-50 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-shadow border-2 border-amber-100 hover:border-amber-300"
            >
              <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-white">
                <img src={journal.imageUrl} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <h3 className="font-bold text-gray-800">{journal.date}</h3>
              <p className="text-gray-600 text-sm line-clamp-2 mt-2">{journal.journal}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
