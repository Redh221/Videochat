export type ContaintsType = {
  audio: { deviceId?: { exact: string } } | false;
  video:
    | {
        deviceId?: { exact: string };
        height?: number | { ideal: number } | { min: number; max: number };
        width?: number | { ideal: number } | { min: number; max: number };
      }
    | false;
};
export type MediaDeviceInfo = {
  deviceId: string;
  kind: "audioinput" | "videoinput" | "audiooutput";
  label: string;
  groupId: string;
};
// it's already included, don't need to type it manually, but i did :)

export type DeviceList = {
  audioSource: MediaDeviceInfo[];
  videoSource: MediaDeviceInfo[];
  outputAudio: MediaDeviceInfo[];
};
