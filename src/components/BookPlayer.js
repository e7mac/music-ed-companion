import React, { useState } from 'react';
import ChapterPlayer from './ChapterPlayer.js';

export default function BookPlayer(props) {
  const [index, setIndex] = useState(0)

  const selectPreviousItem = () => {
    if (index - 1 > 0) {
      setIndex(index - 1);
    }
  }

  const selectNextItem = () => {
    if (index + 1 < props.book.chapters.length) {
      setIndex(index + 1);
    }
  }

  return (
    <>
      <h1>{props.book.name}</h1>
      <ChapterPlayer
        chapter={props.book.chapters[index]}
        baseUrl={props.book.baseUrl}
        prev={selectPreviousItem}
        next={selectNextItem}
      />
    </>
  );
}
