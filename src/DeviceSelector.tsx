import React from "react";
import { MediaDeviceInfo } from "./types";

type DeviceSelectorProps = {
  devices: MediaDeviceInfo[];
  type: "audioinput" | "videoinput" | "audiooutput";
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};
export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  devices,
  type,
  onChange,
}) => {
  return (
    <select onChange={onChange} defaultValue="">
      <option disabled value="">
        {type === "audioinput"
          ? "Microphone"
          : type === "videoinput"
          ? "Camera"
          : "Speakers"}
      </option>
      {devices.map((device, index) => (
        <option
          key={device.groupId + index}
          data-type={type}
          value={device.deviceId}
        >
          {device.label}
        </option>
      ))}
    </select>
  );
};

export default DeviceSelector;
