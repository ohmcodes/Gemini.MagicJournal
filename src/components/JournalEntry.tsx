import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GoogleGenAI, Type } from '@google/genai';
import { Loader2, BookOpen, ArrowLeft, Sparkles } from 'lucide-react';

interface JournalEntryProps {
  key?: string;
  transcript: { role: string; text: string }[];
  onClose: () => void;
  onSave: (data: any) => void;
}

export function JournalEntry({ transcript, onClose, onSave }: JournalEntryProps) {
  const [journalText, setJournalText] = useState('');
  const [story, setStory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const generateJournal = async () => {
      try {
        const apiKey = process.env.GEMINI_API_KEY || '';
        if (!apiKey) throw new Error("API key missing");
        
        const ai = new GoogleGenAI({ apiKey });
        
        // 1. Generate Story and Image Prompt
        const conversationContext = transcript.map(t => `${t.role}: ${t.text}`).join('\n');
        
        const textResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Based on the following conversation with a child about their day, please generate three things:
1. A factual, simple journal entry documenting what the child did today.
2. A short, magical, and encouraging storybook-style version of their day (about 3 paragraphs).
3. A detailed prompt for an image generator to create an illustration for this story. Make the image prompt kid-friendly, colorful, and magical.

Conversation:
${conversationContext || "Child: I had a fun day playing outside!"}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                journal: {
                  type: Type.STRING,
                  description: "The factual documentation of the child's day."
                },
                story: {
                  type: Type.STRING,
                  description: "The magical storybook version of the day."
                },
                imagePrompt: {
                  type: Type.STRING,
                  description: "The detailed prompt for the image generator."
                }
              },
              required: ["journal", "story", "imagePrompt"]
            }
          }
        });

        const result = JSON.parse(textResponse.text || '{}');
        setJournalText(result.journal || "Today was a good day.");
        setStory(result.story || "Once upon a time, there was a magical day...");
        
        // 2. Generate Image
        const imagePrompt = result.imagePrompt || "A magical, colorful illustration of a child's fun day, storybook style.";
        
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { text: imagePrompt }
            ]
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "1K"
            }
          }
        });

        let base64Image = '';
        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            base64Image = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }

        if (base64Image) {
          setImageUrl(base64Image);
        } else {
          setImageUrl("https://picsum.photos/seed/magic/800/800");
        }

        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setError("Oops! Something went wrong while creating your magical journal.");
        setIsLoading(false);
      }
    };

    generateJournal();
  }, [transcript]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-12 flex flex-col items-center justify-center min-h-[500px]"
      >
        <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Weaving Magic...</h2>
        <p className="text-gray-500 text-center">
          Turning your day into a beautiful storybook!
        </p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-12 flex flex-col items-center justify-center min-h-[500px]"
      >
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Oh no!</h2>
        <p className="text-gray-600 text-center mb-8">{error}</p>
        <button
          onClick={onClose}
          className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Go Back
        </button>
      </motion.div>
    );
  }

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
          Discard
        </button>
        <div className="flex items-center gap-2 text-amber-800 font-bold text-lg">
          <BookOpen className="w-6 h-6" />
          My Magic Journal
        </div>
        <button
          onClick={() => {
            onSave({
              id: Date.now().toString(),
              date: new Date().toLocaleDateString(),
              journal: journalText,
              story,
              imageUrl
            });
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl transition-colors shadow-md"
        >
          Save to Bookshelf
        </button>
      </div>

      <div className="p-8 md:p-12 flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-1/2 flex flex-col gap-6">
          <div className="aspect-square rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-white">
            <img
              src={imageUrl}
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
              {journalText}
            </p>
          </div>
        </div>
        
        <div className="w-full md:w-1/2 bg-white p-8 rounded-3xl shadow-sm border-2 border-amber-100">
          <h3 className="text-2xl font-bold text-indigo-800 mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" /> Magical Adventure
          </h3>
          <div className="prose prose-amber prose-lg">
            {story.split('\n\n').map((paragraph, index) => (
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
