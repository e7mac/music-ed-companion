import React, { useState } from 'react';
import ChapterPlayer from './ChapterPlayer.js';
import { Accordion, Card, ListGroup } from 'react-bootstrap';

export default function BookPlayer(props) {
  const [index, setIndex] = useState(0)
  const [exampleIndex, setExampleIndex] = useState(0)

  const selectPreviousItem = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  }

  const selectNextItem = () => {
    if (index + 1 < props.book.chapters.length) {
      setIndex(index + 1);
    }
  }

  const selectItem = (ch, ex) => {
    setIndex(ch)
    setExampleIndex(ex)
  }

  return (
    <>
      <h1>{props.book.name}</h1>
      <ChapterPlayer
        chapter={props.book.chapters[index]}
        baseUrl={props.book.baseUrl}
        exampleIndex={exampleIndex}
        prev={selectPreviousItem}
        next={selectNextItem}
      />
      <Accordion>
        {
          props.book.chapters.map( (data, idx) => {
            return  <Card>
                      <Accordion.Toggle as={Card.Header} variant="link" eventKey={idx}>
                        {data.name}
                      </Accordion.Toggle>
                      <Accordion.Collapse eventKey={idx}>
                      <ListGroup>
                      {
                        data.examples.map( (ex, idx2) => {
                          return <ListGroup.Item onClick={() => {selectItem(idx, idx2)}}>{ex.name}</ListGroup.Item>
                        })
                      }
                      </ListGroup>
                      </Accordion.Collapse>
                    </Card>
          })
        }
      </Accordion>
    </>
  );
}
