import React, { useState } from 'react';
import ExamplePlayer from './ExamplePlayer.js';

export default function ChapterPlayer(props) {
  const [index, setIndex] = useState(0)

  const selectPreviousItem = () => {
    if (index - 1 > 0) {
      setIndex(index - 1);
    }
  }

  const selectNextItem = () => {
    if (index + 1 < props.chapter.examples.length) {
      setIndex(index + 1);
    }
  }

  return (
    <>
      <h3>{props.chapter.name}</h3>
      <div>
        <span onClick={selectPreviousItem}>Prev </span>
        <span onClick={selectNextItem}> Next</span>
      </div>
      <ExamplePlayer
        item={props.chapter.examples[index]}
        baseUrl={`${props.baseUrl}${props.chapter.name}/`}
      />
    </>
  );
}
