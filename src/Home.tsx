import React, { useState } from "react";
import { MyButton } from "./beautiful-button";
import { useNavigate } from "react-router-dom";
import { MyInput } from "./Input";

const Home = () => {
  const [channelName, setChannelName] = useState("");
  const [userName, setUserName] = useState("");

  const navigate = useNavigate();
  const onCallClick = () => {
    if (channelName.length > 0 && userName.length > 0) {
      navigate(`/call?channelName=${channelName}&userName=${userName}`);
    } else {
      alert("Please select a channel");
    }
  };
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const newValue = e.target.value;
    setter(newValue);
    console.log(newValue);
  };
  return (
    <div>
      <MyInput
        value={userName}
        onChange={(e) => handleInputChange(e, setUserName)}
        placeholder="Enter your name"
      />

      <MyInput
        value={channelName}
        onChange={(e) => handleInputChange(e, setChannelName)}
        placeholder="Enter channel name"
      />
      <div>
        <MyButton onClick={onCallClick}>Join Channel</MyButton>
      </div>
      <div>
        <button></button>
      </div>
    </div>
  );
};

export default Home;
