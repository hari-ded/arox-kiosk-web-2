import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, AlertCircle, Clock, X, ChevronRight, Loader2, ShieldQuestion } from 'lucide-react';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './Card';
import { signalingService } from '../services/signaling';
import { createSupportCall } from '../services/api';
import { SupportCategory } from '../types';
import { cn } from '../lib/utils';
import { playClickSound } from '../utils/audio';

export const SupportOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [callState, setCallState] = useState<'idle' | 'selecting_category' | 'connecting' | 'queued' | 'active' | 'ended'>('idle');
  const [category, setCategory] = useState<SupportCategory | null>(null);
  const [description, setDescription] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callId, setCallId] = useState<number | null>(null);

  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    let timer: any;
    if (callState === 'active') {
      timer = setInterval(() => setCallDuration(p => p + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  useEffect(() => {
    if (isOpen && callState === 'idle') {
       signalingService.connect(false); // Connect as kiosk
       setCallState('selecting_category');
    }
  }, [isOpen, callState]);

  useEffect(() => {
    // Setup signaling listeners
    signalingService.onCallStatusChange = (status, data) => {
      if (status === 'queued' || status === 'waiting') setCallState('queued');
      if (status === 'connected') setCallState('active');
      if (status === 'ended') {
        cleanupCall();
        setCallState('ended');
        setTimeout(() => {
          setIsOpen(false);
          setCallState('idle');
          signalingService.disconnect();
        }, 3000);
      }
    };

    signalingService.onOffer = async (offer, incomingCallId) => {
      if (!peerConnection.current || incomingCallId !== callId) return;
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      signalingService.sendAnswer(answer, incomingCallId);
    };

    signalingService.onIceCandidate = (candidate, incomingCallId) => {
      if (peerConnection.current && incomingCallId === callId) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    return () => {
      signalingService.onCallStatusChange = null;
      signalingService.onOffer = null;
      signalingService.onIceCandidate = null;
    };
  }, [callId]);

  const initWebRTC = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.current = stream;
      if (localAudioRef.current) localAudioRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnection.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate && callId) {
          signalingService.sendIceCandidate(event.candidate, callId); 
        }
      };

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert("Microphone access is required for support calls.");
      return false;
    }
    return true;
  };

  const startCall = async () => {
    if (!category) return;
    const hasMic = await initWebRTC();
    if (!hasMic) return;

    setCallState('connecting');
    try {
      // 1. Create call record via REST
      const callRecord = await createSupportCall(category, description);
      setCallId(callRecord.id);
      
      // 2. Join call via WebSocket
      signalingService.joinKioskCall(callRecord.id, '1', category, description);
    } catch (err) {
      console.error(err);
      cleanupCall();
      setCallState('idle');
      alert("Failed to connect to support. Please try again.");
    }
  };

  const endCall = () => {
    if (callId) {
      signalingService.endSupportCall(callId);
    }
    cleanupCall();
    setCallState('ended');
    setTimeout(() => {
      setIsOpen(false);
      setCallState('idle');
      signalingService.disconnect();
    }, 2000);
  };

  const cleanupCall = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setCallDuration(0);
    setCallId(null);
  };

  const toggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!localStream.current.getAudioTracks()[0].enabled);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-8 left-8 z-50 pointer-events-auto">
        <button 
          className="bg-white hover:bg-gray-50 border border-gray-100 shadow-sm rounded-full py-3 px-6 flex items-center space-x-3 transition-colors"
          onClick={() => { playClickSound(); setIsOpen(true); setCallState('selecting_category'); }}
        >
          <div className="bg-[#f03861] text-white p-1.5 rounded-full">
            <ShieldQuestion className="w-5 h-5" />
          </div>
          <span className="font-bold text-gray-800 tracking-tight">Need Help?</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <audio ref={localAudioRef} muted autoPlay playsInline className="hidden" />
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
      
      <Card className="w-full max-w-lg shadow-2xl relative overflow-hidden">
        {callState === 'selecting_category' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-semibold">Need Help?</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="rounded-full h-12 w-12 p-0">
                <X className="w-6 h-6" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-lg text-gray-500 mb-4">What seems to be the issue?</p>
              
              {(['paper_jam', 'toner_out', 'payment_issue', 'other'] as SupportCategory[]).map(cat => (
                <Button 
                  key={cat} 
                  variant="outline" 
                  size="xl" 
                  className={cn("w-full justify-between font-normal", category === cat ? 'border-[#f5a623] bg-[#fff7ed] ring-2 ring-[#f5a623]' : '')}
                  onClick={() => setCategory(cat)}
                >
                  <span className="capitalize">{cat.replace('_', ' ')}</span>
                  <ChevronRight className="w-6 h-6 text-gray-400" />
                </Button>
              ))}

              {category && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-4 space-y-4">
                  <textarea 
                    className="w-full p-4 rounded-xl border border-gray-200 text-lg focus:outline-none focus:ring-2 focus:ring-[#f5a623] resize-none"
                    placeholder="Optional details..."
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                  <Button size="xl" className="w-full text-xl" onClick={startCall}>
                    <Phone className="w-6 h-6 mr-3" />
                    Call Support
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {(callState === 'connecting' || callState === 'queued') && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-[#fff2e3] flex items-center justify-center animate-pulse">
              <Phone className="w-10 h-10 text-[#f5a623] animate-bounce" />
            </div>
            <h2 className="text-3xl font-semibold">
              {callState === 'connecting' ? 'Connecting...' : 'Waiting for Agent...'}
            </h2>
            <p className="text-xl text-gray-500">
              {callState === 'queued' ? 'You are in the queue. An agent will be with you shortly.' : 'Establishing connection...'}
            </p>
            <Button variant="danger" size="lg" className="mt-8 rounded-full" onClick={endCall}>
              Cancel Call
            </Button>
          </div>
        )}

        {callState === 'active' && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-8 bg-gray-900 text-white">
            <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center border-4 border-green-500 relative">
              <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-20"></div>
              <Phone className="w-12 h-12 text-green-500" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold">Support Agent</h2>
              <div className="flex items-center justify-center mt-2 text-gray-400 text-xl font-mono">
                <Clock className="w-5 h-5 mr-2" />
                {formatTime(callDuration)}
              </div>
            </div>
            
            <div className="flex space-x-6 pt-8">
              <Button 
                variant="outline" 
                size="xl" 
                className={cn("rounded-full h-20 w-20 p-0 border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white", isMuted && 'bg-red-900/50 border-red-500 text-red-500 hover:bg-red-900/50')}
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </Button>
              <Button 
                variant="danger" 
                size="xl" 
                className="rounded-full h-20 w-20 p-0 shadow-lg shadow-red-900/20"
                onClick={endCall}
              >
                <PhoneOff className="w-8 h-8" />
              </Button>
            </div>
          </div>
        )}

        {callState === 'ended' && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
              <PhoneOff className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-3xl font-semibold">Call Ended</h2>
            <p className="text-xl text-gray-500">Thank you for contacting support.</p>
          </div>
        )}
      </Card>
    </div>
  );
};
