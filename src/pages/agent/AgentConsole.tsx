import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { SupportCall } from '../../types';
import { Phone, Clock, Monitor, User, ShieldAlert, PhoneOff, MicOff, Mic, Loader2, CheckCircle2 } from 'lucide-react';
import { signalingService } from '../../services/signaling';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export const AgentConsole = () => {
  const [calls, setCalls] = useState<SupportCall[]>([]);
  const [activeCall, setActiveCall] = useState<SupportCall | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    signalingService.connect(true, 'agent-1', 'Support Agent');

    signalingService.onQueueSnapshot = (data) => {
       if (data && data.queue) {
          setCalls(data.queue);
       }
    };

    signalingService.onAgentAssigned = (data) => {
       // We were assigned a call, find it from queue or create stub
       const callId = data.call_id;
       const call = calls.find(c => c.id === callId) || {
          id: callId,
          kiosk_id: 'Unknown',
          category: 'other',
          description: '',
          status: 'connected',
          started_at: new Date().toISOString()
       } as SupportCall;
       
       handleCallAssigned(call);
    };
    
    signalingService.onCallStatusChange = (status, data) => {
      if (status === 'ended' && activeCall && data?.callId === activeCall.id) {
         endActiveCallLocally();
      }
    };

    return () => {
      signalingService.disconnect();
    };
  }, [calls, activeCall]);

  const handleCallAssigned = async (call: SupportCall) => {
    const pc = await setupWebRTC(call.id);
    if (!pc) return;

    setActiveCall(call);
    setCalls(calls.filter(c => c.id !== call.id));
    
    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    signalingService.sendOffer(offer, parseInt(call.id as string));
  };

  // WebRTC Setup (Agent Side)
  useEffect(() => {
    signalingService.onAnswer = async (answer, incomingCallId) => {
       if (peerConnection.current && parseInt(activeCall?.id as string) === incomingCallId) {
         await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
       }
    };

    signalingService.onIceCandidate = (candidate, incomingCallId) => {
       if (peerConnection.current && parseInt(activeCall?.id as string) === incomingCallId) {
          peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
       }
    };
  }, [activeCall]);

  // Timer for active call
  useEffect(() => {
    let timer: any;
    if (activeCall) {
      timer = setInterval(() => setCallDuration(p => p + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [activeCall]);

  const setupWebRTC = async (callId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;
      if (localAudioRef.current) localAudioRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnection.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          signalingService.sendIceCandidate(event.candidate, parseInt(callId));
        }
      };

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };
      
      return pc;
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Microphone required to answer calls.");
      return null;
    }
  };

  const endActiveCallLocally = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setActiveCall(null);
    setCallDuration(0);
  };

  const endCall = () => {
    if (activeCall) {
      signalingService.endSupportCall(parseInt(activeCall.id as string));
    }
    endActiveCallLocally();
  };

  const toggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(t => t.enabled = !t.enabled);
      setIsMuted(!localStream.current.getAudioTracks()[0].enabled);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans selection:bg-[#f03861]/20">
      <audio ref={localAudioRef} muted autoPlay className="hidden" />
      <audio ref={remoteAudioRef} autoPlay className="hidden" />

      {/* Sidebar - Queue */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center text-gray-900">
              <ShieldAlert className="w-6 h-6 mr-2 text-[#f03861]" />
              Support Queue
            </h2>
            <div className="bg-[#f03861]/10 text-[#f03861] text-sm font-bold px-3 py-1 rounded-full">
              {calls.length}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {calls.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-8 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No active support requests.</p>
              </motion.div>
            ) : (
              calls.map(call => (
                <motion.div 
                  key={call.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="hover:shadow-md transition-shadow border-l-4 border-l-[#f5a623] overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center font-mono text-sm font-semibold text-gray-700">
                          <Monitor className="w-4 h-4 mr-1 text-gray-400" />
                          {call.kiosk_id}
                        </div>
                        <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded-md">
                          {Math.floor((Date.now() - new Date(call.started_at).getTime()) / 60000)}m wait
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 capitalize mb-1">
                        {call.category.replace('_', ' ')}
                      </h4>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {call.description}
                      </p>
                      
                      <div className="mt-4 p-2 bg-yellow-50 text-yellow-800 text-xs font-medium rounded-lg text-center border border-yellow-100">
                         Waiting for assignment...
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content - Active Workspace */}
      <div className="flex-1 flex flex-col relative bg-gray-50">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 justify-between">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">A-ROX Agent Console</h1>
          <div className="flex items-center space-x-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-gray-700">Available</span>
          </div>
        </header>

        <main className="flex-1 p-8 flex items-center justify-center">
          {activeCall ? (
            <Card className="w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border-0 rounded-3xl">
              <div className="bg-gray-900 text-white p-10 flex flex-col items-center">
                <div className="w-28 h-28 rounded-full bg-[#f5a623]/20 border-2 border-[#f5a623] flex items-center justify-center mb-6 relative shadow-[0_0_30px_rgba(42,139,242,0.3)]">
                   <div className="absolute inset-0 rounded-full border-2 border-[#f03861] animate-ping opacity-30"></div>
                   <Phone className="w-12 h-12 text-[#f03861]" />
                </div>
                
                <h2 className="text-3xl font-bold mb-2 tracking-tight">Call with Kiosk {activeCall.kiosk_id}</h2>
                <div className="text-[#f03861] font-mono text-xl flex items-center font-medium">
                  <Clock className="w-5 h-5 mr-2" />
                  {formatTime(callDuration)}
                </div>

                <div className="flex space-x-6 mt-10">
                  <Button 
                    variant="outline" 
                    className={`rounded-full h-20 w-20 p-0 border-gray-700 bg-gray-800 text-white hover:bg-gray-700 shadow-xl ${isMuted ? 'bg-red-900/80 border-red-500 text-red-500 hover:bg-red-900' : ''}`}
                    onClick={toggleMute}
                  >
                    {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                  </Button>
                  <Button 
                    variant="danger" 
                    className="rounded-full h-20 px-10 text-xl font-bold shadow-[0_10px_20px_rgba(240,56,97,0.3)] bg-[#f03861] hover:bg-[#d62d51]"
                    onClick={endCall}
                  >
                    <PhoneOff className="w-8 h-8 mr-3" />
                    End Call
                  </Button>
                </div>
              </div>

              <div className="p-8 bg-white">
                <h3 className="font-bold text-gray-400 uppercase tracking-wider text-sm mb-4">Ticket Details</h3>
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Issue Category</label>
                    <div className="font-semibold text-xl capitalize text-gray-900">{activeCall.category.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">User Description</label>
                    <div className="bg-gray-50 p-5 rounded-2xl text-gray-700 border border-gray-100 text-lg">
                      {activeCall.description || <span className="text-gray-400 italic">No description provided</span>}
                    </div>
                  </div>
                  <div className="pt-6 border-t border-gray-100">
                     <label className="text-xs font-semibold text-gray-500 block mb-2">Resolution Notes (Internal)</label>
                     <textarea 
                       className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:bg-white resize-none transition-all"
                       rows={3}
                       placeholder="Enter notes before ending call..."
                     />
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="text-center text-gray-400">
              <Monitor className="w-32 h-32 mx-auto mb-6 opacity-20 text-gray-500" />
              <h2 className="text-3xl font-bold text-gray-400 tracking-tight">Ready for calls</h2>
              <p className="mt-3 text-xl text-gray-400 max-w-md mx-auto">Calls will automatically connect when assigned by the queue manager.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
