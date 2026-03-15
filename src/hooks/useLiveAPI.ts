import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function useLiveAPI(apiKey: string) {
  const [isConnected, setIsConnected] = useState(false);
  const isConnectedRef = useRef(false);
  const [shouldFinish, setShouldFinish] = useState(false);
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const isCameraOnRef = useRef(true);
  const isMicOnRef = useRef(true);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoIntervalRef = useRef<any>(null);

  const toggleCamera = useCallback(() => {
    setIsCameraOn(prev => {
      const next = !prev;
      isCameraOnRef.current = next;
      if (mediaStreamRef.current) {
        const videoTracks = mediaStreamRef.current.getVideoTracks();
        videoTracks.forEach(track => {
          track.enabled = next;
        });
      }
      return next;
    });
  }, []);

  const toggleMic = useCallback(() => {
    setIsMicOn(prev => {
      const next = !prev;
      isMicOnRef.current = next;
      if (mediaStreamRef.current) {
        const audioTracks = mediaStreamRef.current.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = next;
        });
      }
      return next;
    });
  }, []);

  const connect = useCallback(async () => {
    if (!apiKey) return;

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      await audioContextRef.current.audioWorklet.addModule('/audio-worklet.js');

      if (!audioContextRef.current) return; // Check if disconnected during await

      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: { width: 320, height: 240 }
      });
      
      if (!audioContextRef.current) return; // Check if disconnected during await

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
      }
      
      // Ensure initial state matches the tracks
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = isCameraOnRef.current;
      }
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = isMicOnRef.current;
      }
      
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      
      workletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'pcm-processor');
      source.connect(workletNodeRef.current);
      workletNodeRef.current.connect(audioContextRef.current.destination);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
          },
          systemInstruction: "You are a friendly magical journal companion for a child. You appear as a cute robot. You can see them through the camera. Ask them about their day. Keep responses short and engaging. When they say they are done, say a warm goodbye and end your response with '[JOURNAL_FINISHED]'.",
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            isConnectedRef.current = true;
            
            // Send initial message to make the AI talk right away
            sessionPromise.then(session => {
              if (!isConnectedRef.current) return;
              try {
                session.sendClientContent({
                  turns: [{
                    role: 'user',
                    parts: [{ text: "Hello! I'm ready to journal. Please greet me and ask about my day!" }]
                  }],
                  turnComplete: true
                });
              } catch (e) {
                console.error('Error sending initial message:', e);
              }
            });
            
            let audioBuffer: Int16Array[] = [];
            let audioBufferLength = 0;
            
            workletNodeRef.current!.port.onmessage = (event) => {
              if (!isConnectedRef.current) return;
              const pcmData = new Int16Array(event.data);
              if (pcmData.length === 0) return;
              
              audioBuffer.push(pcmData);
              audioBufferLength += pcmData.length;
              
              // Send every ~100ms (1600 samples at 16000Hz)
              if (audioBufferLength >= 1600) {
                const combined = new Int16Array(audioBufferLength);
                let offset = 0;
                for (const buf of audioBuffer) {
                  combined.set(buf, offset);
                  offset += buf.length;
                }
                
                const base64Data = arrayBufferToBase64(combined.buffer);
                sessionPromise.then(session => {
                  if (!isConnectedRef.current) return;
                  try {
                    session.sendRealtimeInput({
                      media: {
                        mimeType: 'audio/pcm;rate=16000',
                        data: base64Data
                      }
                    });
                  } catch (e) {
                    console.error('Error sending audio:', e);
                  }
                });
                
                audioBuffer = [];
                audioBufferLength = 0;
              }
            };
            
            // Start video streaming loop
            videoIntervalRef.current = setInterval(() => {
              if (!isConnectedRef.current) return;
              if (videoRef.current && videoRef.current.readyState >= 2) {
                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                if (canvas.width > 0 && canvas.height > 0) {
                  const context = canvas.getContext('2d');
                  if (context) {
                    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                    const base64Data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                    sessionPromise.then(session => {
                      if (!isConnectedRef.current) return;
                      try {
                        session.sendRealtimeInput({
                          media: {
                            mimeType: 'image/jpeg',
                            data: base64Data
                          }
                        });
                      } catch (e) {
                        console.error('Error sending video:', e);
                      }
                    });
                  }
                }
              }
            }, 1000); // 1 frame per second
          },
          onmessage: (message: LiveServerMessage) => {
            console.log('LiveMessage:', message);
            
            if (message.serverContent?.modelTurn?.parts) {
              const audioPart = message.serverContent.modelTurn.parts.find(p => p.inlineData?.mimeType.startsWith('audio/pcm'));
              if (audioPart && audioPart.inlineData) {
                const base64Audio = audioPart.inlineData.data;
                playAudio(base64Audio);
              }
            }

            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
              nextPlayTimeRef.current = 0;
            }

            // Handle transcriptions
            // Output transcription
            if (message.serverContent?.modelTurn?.parts) {
               const textPart = message.serverContent.modelTurn.parts.find(p => p.text);
               if(textPart && textPart.text) {
                 setTranscript(prev => [...prev, { role: 'model', text: textPart.text }]);
                 if (textPart.text.includes('[JOURNAL_FINISHED]')) {
                   setShouldFinish(true);
                 }
               }
            }
            
            // Input transcription (user)
            const anyMessage = message as any;
            if (anyMessage.clientContent?.turnComplete) {
                // sometimes input transcription comes here
            }
          },
          onclose: () => {
            setIsConnected(false);
            isConnectedRef.current = false;
            cleanupAudio();
          },
          onerror: (error) => {
            console.error('Live API Error:', error);
            setIsConnected(false);
            isConnectedRef.current = false;
            cleanupAudio();
          }
        }
      });

      sessionRef.current = await sessionPromise;

      // If disconnect was called while we were awaiting the session, close it immediately
      if (!audioContextRef.current) {
        try {
          sessionRef.current?.close?.();
        } catch(e) {}
        sessionRef.current = null;
      }

    } catch (error) {
      console.error('Failed to connect:', error);
      cleanupAudio();
    }
  }, [apiKey]);

  const playAudio = (base64Audio: string) => {
    if (!audioContextRef.current) return;
    
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const pcm16 = new Int16Array(bytes.buffer);
    
    const audioBuffer = audioContextRef.current.createBuffer(1, pcm16.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 32768.0;
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    const currentTime = audioContextRef.current.currentTime;
    if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime;
    }
    
    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += audioBuffer.duration;
  };

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      // The SDK might not have a direct close method on the session object depending on version, 
      // but we can try to close the underlying connection or just clean up our side.
      try {
        sessionRef.current.close?.();
      } catch(e) {}
      sessionRef.current = null;
    }
    setIsConnected(false);
    cleanupAudio();
  }, []);

  const cleanupAudio = () => {
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;
  };

  // Add a way to manually add transcript for testing or if the API doesn't return it reliably
  const addTranscript = (role: string, text: string) => {
    setTranscript(prev => [...prev, { role, text }]);
  };

  return { isConnected, connect, disconnect, transcript, addTranscript, videoRef, shouldFinish, isCameraOn, isMicOn, toggleCamera, toggleMic };
}
