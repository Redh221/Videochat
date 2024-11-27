import { DeviceList } from "./types";

export const isStreamActive = (
  mediaStreamRef: React.RefObject<MediaStream | null>
) => {
  return (
    mediaStreamRef.current &&
    mediaStreamRef.current.active &&
    mediaStreamRef.current
      .getTracks()
      .some((track) => track.readyState === "live")
  );
};
export function isDeviceListGuard(state: unknown): state is DeviceList {
  return (
    state !== null &&
    typeof state === "object" &&
    "audioSource" in state &&
    "videoSource" in state &&
    "outputAudio" in state &&
    Array.isArray((state as DeviceList).audioSource) &&
    Array.isArray((state as DeviceList).videoSource) &&
    Array.isArray((state as DeviceList).outputAudio)
  );
}
