import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { MyButton } from "./beautiful-button";
import { useDeviceManager } from "./useDevice";
import { isDeviceListGuard } from "./utils";
import DeviceSelector from "./DeviceSelector";
import { io, Socket } from "socket.io-client";

const socketUrl = "https://signal-server.waterhedgehog.com";

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
  const socket = useRef<Socket | null>(null);
  const localPeerConnection = useRef<RTCPeerConnection | null>(null);
  const remoteStreamRef = useRef<HTMLVideoElement | null>(null);

  const queryParams = new URLSearchParams(location.search);
  const channelName = queryParams.get("channelName");
  const userName = queryParams.get("userName");

  const memoizedGetCameraStream = useCallback(() => {
    getCameraStream();
  }, [getCameraStream]);

  const hasMounted = useRef(false);

  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;

    socket.current = io(socketUrl, {
      secure: true,
      reconnection: true,
      rejectUnauthorized: false,
    });

    socket.current.on("connect", () => {
      console.log("Connected to socket.io server");
      memoizedGetCameraStream();
      socket.current?.emit("join", { channelName, userName });
    });

    socket.current.on("disconnect", () => {
      console.log("Disconnected from socket.io server");
    });

    socket.current.on("joined", (userNames) => {
      console.log("Users in this channel:", userNames);
    });

    socket.current.on("offer_sdp_received", (data) => {
      console.log("Offer SDP received from:", data.from);
      onAnswer(data.sdp);
    });

    socket.current.on("answer_sdp_received", (data) => {
      console.log("Answer SDP received from:", data.from);
      gotRemoteDescription(data.sdp);
    });

    socket.current.on("ice_candidate_received", (data) => {
      console.log("ICE candidate received from:", data.from);
      const candidate = new RTCIceCandidate(data.candidate);

      localPeerConnection.current
        ?.addIceCandidate(candidate)
        .then(() => {
          console.log("Successfully added ICE candidate:", candidate);
        })
        .catch((error) => {
          console.error("Error adding ICE candidate:", error);
        });
    });

    return () => {
      socket.current?.disconnect();
      localPeerConnection.current?.close();
      if (videoRef.current?.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [channelName, userName, memoizedGetCameraStream, videoRef]);

  const gotRemoteDescription = (answer: RTCSessionDescriptionInit) => {
    localPeerConnection.current
      ?.setRemoteDescription(answer)
      .catch((error) =>
        console.error("Error setting remote description:", error)
      );
  };

  const onAnswer = (offer: RTCSessionDescriptionInit) => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
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
        socket.current?.emit("send_answer", {
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
      socket.current?.emit("send_ice_candidate", {
        channelName,
        userName,
        candidate: event.candidate,
      });
    }
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
      socket.current?.emit("send_ice_candidate", {
        channelName,
        userName,
        candidate: event.candidate,
      });
    }
  };

  const gotLocalDescription = (offer: RTCSessionDescriptionInit) => {
    localPeerConnection.current
      ?.setLocalDescription(offer)
      .then(() => {
        socket.current?.emit("send_offer", {
          channelName,
          userName,
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
