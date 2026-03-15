import { useState } from 'react';
import { LiveJournal } from './components/LiveJournal';
import { JournalEntry } from './components/JournalEntry';
import { JournalList } from './components/JournalList';
import { JournalViewer } from './components/JournalViewer';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Sparkles, Library } from 'lucide-react';

export interface JournalData {
  id: string;
  date: string;
  journal: string;
  story: string;
  imageUrl: string;
}

export default function App() {
  const [view, setView] = useState<'home' | 'live' | 'journal' | 'list' | 'viewer'>('home');
  const [transcript, setTranscript] = useState<{role: string, text: string}[]>([]);
  const [journals, setJournals] = useState<JournalData[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<JournalData | null>(null);

  const handleFinishJournaling = (finalTranscript: {role: string, text: string}[]) => {
    setTranscript(finalTranscript);
    setView('journal');
  };

  const handleSaveJournal = (data: JournalData) => {
    setJournals(prev => [data, ...prev]);
    setView('list');
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex flex-col items-center justify-center p-4 font-sans">
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center"
          >
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Magic Journal</h1>
            <p className="text-lg text-gray-600 mb-8">
              Tell me about your day, and I'll turn it into a magical storybook!
            </p>
            <div className="space-y-4">
              <button
                onClick={() => setView('live')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 text-lg"
              >
                <Sparkles className="w-6 h-6" />
                Start Journaling
              </button>
              <button
                onClick={() => setView('list')}
                className="w-full bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold py-4 px-8 rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-2 text-lg border-2 border-amber-200"
              >
                <Library className="w-6 h-6" />
                View Bookshelf
              </button>
            </div>
          </motion.div>
        )}

        {view === 'live' && (
          <LiveJournal
            key="live"
            onFinish={handleFinishJournaling}
            onCancel={() => setView('home')}
          />
        )}

        {view === 'journal' && (
          <JournalEntry
            key="journal"
            transcript={transcript}
            onClose={() => setView('home')}
            onSave={handleSaveJournal}
          />
        )}

        {view === 'list' && (
          <JournalList
            key="list"
            journals={journals}
            onBack={() => setView('home')}
            onSelect={(j) => {
              setSelectedJournal(j);
              setView('viewer');
            }}
          />
        )}

        {view === 'viewer' && selectedJournal && (
          <JournalViewer
            key="viewer"
            journal={selectedJournal}
            onClose={() => setView('list')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
