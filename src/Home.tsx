import React, { useState } from "react";
import { MyButton } from "./beautiful-button";
import { useNavigate } from "react-router-dom";
import { MyInput } from "./Input";

const Home = () => {
  const [channelName, setChannelName] = useState("");
  const [userName, setUserName] = useState("");
  //   const [value, setValue] = useState("");
  const navigate = useNavigate();
  const onCallClick = () => {
    navigate(`/call?channelName=${channelName}&userName=${userName}`);
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
        <MyButton onClick={onCallClick}>1</MyButton>
        <MyButton color={"red"}>2</MyButton>
      </div>
      <div>
        <button></button>
      </div>
    </div>
  );
};

export default Home;
