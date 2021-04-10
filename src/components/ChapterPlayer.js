import React, { useState, useEffect } from 'react';
import ExamplePlayer from './ExamplePlayer.js';

export default function ChapterPlayer(props) {
  const [currentIndex, setCurrentIndex] = useState(null)

  useEffect( () => {
    setCurrentIndex(0);
  },[]);

  const selectPreviousItem = () => {
    const index = currentIndex - 1
    setCurrentIndex(index);
  }

  const selectNextItem = () => {
    const index = currentIndex + 1
    setCurrentIndex(index);
  }

  return (
    <>
      <h3>{props.examples.name}</h3>
      {
        currentIndex
        ? <>
            <ExamplePlayer
              item={props.examples.examples[currentIndex]}
            />
          </>
        : ""
      }
      <div>
        <span onClick={selectPreviousItem}>Prev</span>
        <span onClick={selectNextItem}>Next</span>
      </div>
    </>
  );
}
