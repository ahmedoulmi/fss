import React, { useState } from "react";
import { questions } from "./Questions.js";

const Quizz = () => {
  const [correct, setCorrect] = useState("");
  const [score, setScore] = useState(0);

  console.log(correct);

  const getCorrecAnswer = () => {
    let answer = "";
    questions.map((q) => {
      answer = q.answer;
    });

    if (correct === answer) {
      setScore(score + 10);
    }
  };

  return (
    <div>
      <h1>Quiz</h1>
      <h1>{score}</h1>
      {questions.map((q) => {
        return (
          <div className="q">
            <h1>{q.question}</h1>
            <div className="choices">
              {q.choices.map((c) => {

                return (
                  <div className="inputs" key={c}>
                    <h1>{c}</h1>
                    <input
                      type="radio"
                      value={c}
                      name={q.question}
                      onClick={() => setCorrect(c)}
                    />
                  </div>
                );
              })}
            </div>
            <button onClick={getCorrecAnswer}>Submit</button>
          </div>
        );
      })}
    </div>
  );
};

export default Quizz;
