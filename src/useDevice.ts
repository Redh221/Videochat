import { useEffect, useRef, useState } from "react";
import { ContaintsType, DeviceList, MediaDeviceInfo } from "./types";
import { isStreamActive } from "./utils";

export function useDeviceManager() {
  const [devicesState, setDevicesState] = useState<
    DeviceList | MediaDeviceInfo[] | null
  >(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const constaintsRef = useRef<ContaintsType>({
    video: { width: 1280, height: 720 },
    audio: { deviceId: { exact: "default" } },
  });
  const speakersRef = useRef<string | null>(null);
  // spcialcase for speakers to save device information

  useEffect(() => {
    const savedDevices = localStorage.getItem("SavedDevices");
    const savedSpeakers = localStorage.getItem("SavedSpeakers");
    if (savedDevices) {
      constaintsRef.current = JSON.parse(savedDevices);
    }
    if (savedSpeakers) {
      speakersRef.current = JSON.parse(savedSpeakers);
    }
    getDevices();
  }, []);

  async function getDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log(devices, "test");
      console.log(devicesState);
      const deviceList: DeviceList = {
        audioSource: [],
        videoSource: [],
        outputAudio: [],
      };
      devices.forEach((device: MediaDeviceInfo) => {
        if (device.kind === "audioinput") {
          deviceList.audioSource.push(device);
        }
        if (device.kind === "videoinput") {
          deviceList.videoSource.push(device);
        }
        if (device.kind === "audiooutput") {
          deviceList.outputAudio.push(device);
        }
      });
      setDevicesState(deviceList);
    } catch (error) {
      console.error(error);
    }
  }
  async function getCameraStream() {
    console.log(constaintsRef.current);
    try {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia(
        constaintsRef.current
      );

      if (videoRef.current && mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
        if (speakersRef.current !== null) {
          await videoRef.current.setSinkId(speakersRef.current);
        }
        //special case for speakers to save device information
      }
    } catch (error) {
      constaintsRef.current = {
        video: { width: 1280, height: 720 },
        audio: { deviceId: { exact: "default" } },
      };
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia(
        constaintsRef.current
      );
      if (videoRef.current && mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
      }
      //case for wrong local storage data \ unplugging devices
    }
  }
  const handleSelectChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedType = e.target.selectedOptions[0].getAttribute("data-type");
    const deviceId = e.target.value;

    if (selectedType === "audioinput") {
      constaintsRef.current.audio = {
        ...constaintsRef.current.audio,
        deviceId: { exact: deviceId },
      };
      if (isStreamActive(mediaStreamRef)) {
        getCameraStream();
      }
    }
    if (selectedType === "videoinput") {
      constaintsRef.current.video = {
        ...constaintsRef.current.video,
        deviceId: { exact: deviceId },
      };
      if (isStreamActive(mediaStreamRef)) {
        getCameraStream();
      }
    }
    if (selectedType === "audiooutput" && videoRef.current) {
      console.log(deviceId + " Spek");
      await videoRef.current.setSinkId(deviceId);
      speakersRef.current = deviceId;
      localStorage.setItem("SavedSpeakers", JSON.stringify(deviceId));
    }

    localStorage.setItem("SavedDevices", JSON.stringify(constaintsRef.current));
  };
  const changeResolution = (parWidth: number, parHeight: number) => {
    constaintsRef.current.video = {
      ...constaintsRef.current.video,
      height: { ideal: parHeight },
      width: { ideal: parWidth },
    };
    localStorage.setItem("SavedDevices", JSON.stringify(constaintsRef.current));
    if (
      isStreamActive(mediaStreamRef) &&
      videoRef.current &&
      videoRef.current.srcObject instanceof MediaStream
    ) {
      videoRef.current.srcObject
        .getVideoTracks()
        .forEach((track: MediaStreamTrack) => {
          track.applyConstraints(
            constaintsRef.current.video as MediaTrackConstraints
          );
        });
    }
  };
  const mediaStreamStop = () => {
    if (videoRef.current && videoRef.current.srcObject instanceof MediaStream) {
      videoRef.current.srcObject.getTracks().forEach((track) => {
        track.stop();
      });
    }
  };
  return {
    changeResolution,
    mediaStreamRef,
    constaintsRef,
    speakersRef,
    devicesState,
    getDevices,
    getCameraStream,
    handleSelectChange,
    videoRef,
    mediaStreamStop,
  };
}
