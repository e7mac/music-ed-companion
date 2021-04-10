import React, { useState } from 'react';
import ExamplePlayer from './ExamplePlayer.js';
import { Button } from 'react-bootstrap';

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
      <h3>
          <Button onClick={props.prev} variant="light">﹤</Button>
          {props.chapter.name}
          <Button onClick={props.next} variant="light">﹥</Button>
      </h3>
      <ExamplePlayer
        item={props.chapter.examples[index]}
        baseUrl={`${props.baseUrl}${props.chapter.name}/`}
        prev={selectPreviousItem}
        next={selectNextItem}
      />
    </>
  );
}
