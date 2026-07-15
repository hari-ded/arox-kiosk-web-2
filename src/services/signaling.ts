import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'https://arox-api-993539509814.asia-south1.run.app';

class WebRTCSignaling {
  socket: Socket | null = null;
  onOffer: ((offer: RTCSessionDescriptionInit, callId: number) => void) | null = null;
  onAnswer: ((answer: RTCSessionDescriptionInit, callId: number) => void) | null = null;
  onIceCandidate: ((candidate: RTCIceCandidateInit, callId: number) => void) | null = null;
  onCallStatusChange: ((status: string, data?: any) => void) | null = null;
  onAgentAssigned: ((data: any) => void) | null = null;
  onQueueSnapshot: ((data: any) => void) | null = null;
  
  connect(isAgent: boolean = false, agentId?: string, agentName?: string) {
    this.socket = io(WS_URL, {
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });

    this.socket.on('connect', () => {
      console.log('Connected to signaling server', this.socket?.id);
      if (isAgent) {
        this.socket?.emit('support:agent-join', { role: 'agent', agentId, agentName });
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
      if (this.onCallStatusChange) {
        this.onCallStatusChange('disconnected');
      }
    });

    this.socket.on('support:offer', (data: { callId: number, sdp: RTCSessionDescriptionInit }) => {
      if (this.onOffer) this.onOffer(data.sdp, data.callId);
    });

    this.socket.on('support:answer', (data: { callId: number, sdp: RTCSessionDescriptionInit }) => {
      if (this.onAnswer) this.onAnswer(data.sdp, data.callId);
    });

    this.socket.on('support:ice-candidate', (data: { callId: number, candidate: RTCIceCandidateInit }) => {
      if (this.onIceCandidate) this.onIceCandidate(data.candidate, data.callId);
    });
    
    this.socket.on('support:queued', (data: any) => {
       if (this.onCallStatusChange) this.onCallStatusChange('queued', data);
    });

    this.socket.on('support:waiting', (data: any) => {
       if (this.onCallStatusChange) this.onCallStatusChange('waiting', data);
    });

    this.socket.on('support:ended', (data: any) => {
       if (this.onCallStatusChange) this.onCallStatusChange('ended', data);
    });

    this.socket.on('support:agent-assigned', (data: any) => {
       if (this.onCallStatusChange) this.onCallStatusChange('connected', data);
       if (this.onAgentAssigned) this.onAgentAssigned(data);
    });

    this.socket.on('support:queue-snapshot', (data: any) => {
      if (this.onQueueSnapshot) this.onQueueSnapshot(data);
    });
  }

  sendOffer(offer: RTCSessionDescriptionInit, callId: number) {
    this.socket?.emit('support:offer', { callId, sdp: offer });
  }

  sendAnswer(answer: RTCSessionDescriptionInit, callId: number) {
    this.socket?.emit('support:answer', { callId, sdp: answer });
  }

  sendIceCandidate(candidate: RTCIceCandidateInit, callId: number) {
    this.socket?.emit('support:ice-candidate', { callId, candidate });
  }
  
  joinKioskCall(callId: number, kioskId: string, category: string, description: string) {
     this.socket?.emit('support:kiosk-join', { callId, kioskId, category, description, kiosk_label: 'Main Lobby', kiosk_location: 'Lobby' });
  }
  
  endSupportCall(callId: number) {
     this.socket?.emit('support:end-call', { callId });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const signalingService = new WebRTCSignaling();
