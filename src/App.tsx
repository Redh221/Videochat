import "./App.css";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import { Call } from "./Call";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/call" element={<Call />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
