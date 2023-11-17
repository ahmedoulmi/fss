import { useState } from "react";
import styled from "styled-components";
import Quizz from "./Quiz";
function E() {
  const [currentStateLeft, setCurrentStateLeft] = useState(0);
  const [currentStateRight, setCurrentStateRight] = useState(0);
  const generateLeftContent = () => {
    switch (currentStateLeft) {
      case "quizz1":
        return <p>Count is {currentStateLeft}</p>;
      case "finale":
        return <p>you changed left !!</p>;
      default:
        return (
          <div>
            <h1>
              Welcome to the <span>Frontend Quiz!</span>
            </h1>
            <p>Pick a subject to get started</p>
          </div>
        );
    }
  };
  const generateRightContent = () => {
    switch (currentStateRight) {
      case "quizz1":
        return <p>Count is {currentStateRight}</p>;
      case "finale":
        return <p>you changed right !!</p>;
      default:
        return (
          <div>
            <button type="button" onClick={setCurrentStateRight}>
              HTML
            </button>
            <button type="button">CSS</button>
            <button type="button">Javascript</button>
            <button type="button">Accessibility</button>
          </div>
        );
    }
  };
  const changeStateLeft = (newStateLeft) => {
    setCurrentStateLeft(newStateLeft);
  };

  return (
    <>
      {" "}
      <Container>
        <div className="left">{generateLeftContent()}</div>
        <div className="right">{generateRightContent()}</div>{" "}
      </Container>
    </>
  );
}

export default E;
const Container = styled.div`
  display: flex;
  align-items: center;
  position: absolute;
  top: 50%;
  left: 50%;
  translate: -50% -50%;
  width: 80%;
  height: 80%;
  background-color: #1f1e24;

  padding: 50px;
  border-radius: 4px;
  background-size: 100%;
  * {
    box-sizing: border-box;
  }
  .left {
    width: 50%;
    color: white;
  }
  .right {
    width: 50%;
  }
`;
