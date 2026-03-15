# Magic Journal

**Elevator pitch:** A magical voice-interactive journal that listens to a child's day and transforms their experiences into an illustrated, personalized storybook adventure.

## Inspiration
I wanted to make journaling fun and accessible for kids who might not be able to write well yet, but have incredible imaginations and stories to tell. I was inspired by the idea of turning everyday events into magical adventures to encourage reflection and creativity.

## What it does
Magic Journal uses the Gemini Live API to have a natural, spoken conversation with a child about their day. The AI acts as a friendly companion, asking engaging questions. Once the child is finished, the app uses Gemini's multimodal capabilities to generate a beautifully written storybook version of their day, complete with a custom AI-generated illustration.

## How I built it
I built the frontend using React, Tailwind CSS, and Framer Motion for a playful UI. I integrated the `@google/genai` SDK to connect to the Gemini Live API (`gemini-2.5-flash-native-audio-preview-09-2025`) for real-time voice interaction. For the journal generation, I used `gemini-3-flash-preview` to craft the story and `gemini-2.5-flash-image` to generate the accompanying illustration based on the day's events. The app is hosted on Google Cloud Run.

## Challenges I ran into
Handling real-time audio streaming and ensuring smooth transitions between the Live API conversation and the final multimodal generation was tricky. I had to carefully manage the WebSocket connection and audio context to provide a seamless experience.

## Accomplishments that I'm proud of
I'm really proud of how natural the conversation feels and how magical the final journal entries look. Seeing a simple recount of a day turn into an illustrated story is incredibly rewarding.

## What I learned
I learned a lot about working with WebSockets for real-time audio, managing complex state in React for multimodal interactions, and effectively prompting different Gemini models for specific tasks (voice, text, and image generation).

## What's next for Magic Journal
I plan to add features like saving past journals to a database (Firebase), allowing kids to print their journals as physical books, and adding more interactive elements to the stories.

**Built with:** React, Tailwind CSS, TypeScript, Vite, Google GenAI SDK, Gemini Live API, Gemini Flash Image, Google Cloud Run
