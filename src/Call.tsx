import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { MyButton } from "./beautiful-button";
import { useDeviceManager } from "./useDevice";
import { isDeviceListGuard } from "./utils";
import DeviceSelector from "./DeviceSelector";

const webSocketUrl = "ws://localhost:8090/ws";

export const Call = () => {
  const {
    devicesState,
    videoRef,
    handleSelectChange,
    getCameraStream,
    changeResolution,
    mediaStreamStop,
  } = useDeviceManager();

  const location = useLocation();
  const ws = useRef<WebSocket | null>(null);
  const localPeerConnection = useRef<RTCPeerConnection | null>(null);
  const remoteStreamRef = useRef<HTMLVideoElement | null>(null);

  const queryParams = new URLSearchParams(location.search);
  const channelName = queryParams.get("channelName");
  const userName = queryParams.get("userName");

  useEffect(() => {
    const wsClient = new WebSocket(webSocketUrl);

    wsClient.onopen = () => {
      console.log("WebSocket connection opened");
      ws.current = wsClient;
      getCameraStream();
      sendWsMessage("join", { channelName: channelName, userName: userName });
    };

    wsClient.onclose = () => {
      console.log("WebSocket connection closed");
    };

    wsClient.onmessage = (message: MessageEvent<string>) => {
      const parsedMessage = JSON.parse(message.data) as {
        type: string;
        body: Record<string, any>;
      };

      const { type, body } = parsedMessage;

      switch (type) {
        case "joined":
          console.log("Users in this channel:", body);
          break;
        case "offer_sdp_received":
          console.log("Offer SDP received from:", body.from);
          onAnswer(body.sdp);
          break;
        case "answer_sdp_received":
          console.log("Answer SDP received from:", body.from);
          gotRemoteDescription(body.sdp);
          break;
        case "ice_candidate_received":
          console.log("ICE candidate received from:", body.from);
          const candidate = new RTCIceCandidate(body.candidate);
          localPeerConnection.current?.addIceCandidate(candidate).catch((e) => {
            console.error("Error adding received ICE candidate", e);
          });
          break;
        default:
          console.warn(`Unhandled message type: ${type}`);
      }
    };

    return () => {
      ws.current?.close();
      localPeerConnection.current?.close();
      if (videoRef.current?.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [getCameraStream, videoRef, channelName, userName]);

  const gotRemoteDescription = (answer: RTCSessionDescriptionInit) => {
    localPeerConnection.current
      ?.setRemoteDescription(answer)
      .catch((error) =>
        console.error("Error setting remote description:", error)
      );
  };

  const onAnswer = (offer: RTCSessionDescriptionInit) => {
    const configuration: RTCConfiguration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
    const peerConnection = new RTCPeerConnection(configuration);
    localPeerConnection.current = peerConnection;

    peerConnection.onicecandidate = gotLocalIceCandidateAnswer;
    peerConnection.ontrack = gotRemoteStream;

    if (videoRef.current?.srcObject instanceof MediaStream) {
      const mediaStream = videoRef.current.srcObject;
      mediaStream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, mediaStream));
    }

    peerConnection
      .setRemoteDescription(offer)
      .then(() => peerConnection.createAnswer())
      .then(gotAnswerDescription)
      .catch((error) => console.error("Error during answer process:", error));
  };

  const gotAnswerDescription = (answer: RTCSessionDescriptionInit) => {
    localPeerConnection.current
      ?.setLocalDescription(answer)
      .then(() => {
        sendWsMessage("send_answer", {
          channelName,
          userName,
          sdp: answer,
        });
      })
      .catch((error) =>
        console.error("Error setting local description:", error)
      );
  };

  const gotLocalIceCandidateAnswer = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      sendWsMessage("send_ice_candidate", {
        channelName: channelName,
        userName: userName,
        candidate: event.candidate,
      });
    }
  };

  const sendWsMessage = (type: string, body: Record<string, any>) => {
    ws.current?.send(JSON.stringify({ type, body }));
  };

  const setupPeerConnection = () => {
    const configuration: RTCConfiguration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    const peerConnection = new RTCPeerConnection(configuration);
    localPeerConnection.current = peerConnection;

    peerConnection.onicecandidate = gotLocalIceCandidateOffer;
    peerConnection.ontrack = gotRemoteStream;

    if (videoRef.current?.srcObject instanceof MediaStream) {
      const mediaStream = videoRef.current.srcObject;
      mediaStream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, mediaStream));
    }

    peerConnection
      .createOffer()
      .then(gotLocalDescription)
      .catch((error) => console.error("Error creating offer:", error));
  };

  const gotLocalIceCandidateOffer = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      sendWsMessage("send_ice_candidate", {
        channelName: channelName,
        userName: userName,
        candidate: event.candidate,
      });
    }
  };

  const gotLocalDescription = (offer: RTCSessionDescriptionInit) => {
    localPeerConnection.current
      ?.setLocalDescription(offer)
      .then(() => {
        sendWsMessage("send_offer", {
          channelName: channelName,
          userName: userName,
          sdp: offer,
        });
      })
      .catch((error) =>
        console.error("Error setting local description:", error)
      );
  };

  const gotRemoteStream = (event: RTCTrackEvent) => {
    if (
      remoteStreamRef.current &&
      remoteStreamRef.current.srcObject !== event.streams[0]
    ) {
      remoteStreamRef.current.srcObject = event.streams[0];
      console.log("Received remote stream");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <div className="video-chat-room">
        <div className="video-settings">
          {isDeviceListGuard(devicesState) ? (
            <>
              <DeviceSelector
                devices={devicesState?.videoSource || []}
                type="videoinput"
                onChange={handleSelectChange}
              />
              <DeviceSelector
                devices={devicesState?.audioSource || []}
                type="audioinput"
                onChange={handleSelectChange}
              />
              <DeviceSelector
                devices={devicesState?.outputAudio || []}
                type="audiooutput"
                onChange={handleSelectChange}
              />
            </>
          ) : (
            <p>Loading devices...</p>
          )}
        </div>
        <div className="video-controls">
          <button onClick={getCameraStream}>Start</button>
          <button onClick={mediaStreamStop}>Stop</button>
          <button>Mute</button>
          <button>Unmute</button>
          <button>Screen Share</button>
          <button onClick={() => changeResolution(1280, 720)}>720p</button>
          <button onClick={() => changeResolution(854, 480)}>480p</button>
          <button onClick={() => changeResolution(640, 360)}>360p</button>
        </div>
        <div className="video-streams">
          <div className="video-window">
            <video ref={videoRef} muted autoPlay playsInline controls />
          </div>
          <div className="video-window">
            <video ref={remoteStreamRef} autoPlay playsInline muted controls />
          </div>
        </div>
      </div>
      <h1 className="text-2xl font-bold">Welcome to the Call!</h1>
      <p className="mt-4 text-lg">Channel Name: {channelName}</p>
      <p className="mt-2 text-lg">User Name: {userName}</p>
      <MyButton onClick={setupPeerConnection}>Start Call</MyButton>
    </div>
  );
};
