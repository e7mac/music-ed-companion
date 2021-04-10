import React from 'react';
import { Button } from 'react-bootstrap';

export default function ExamplePlayer(props) {
  console.log(props.baseUrl + props.item.midi)
	return (
    <>
        <p>
          <Button onClick={props.prev}>Prev</Button>
          {props.item.name}
          <Button onClick={props.next}>Next</Button>
        </p>
        <p>
          <midi-player
            src={props.baseUrl + props.item.midi}
            sound-font="https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus"
          />
        </p>
        <p>
          <img src={props.baseUrl + props.item.image} alt="Musical example"/>
        </p>
    </>
  );
}
