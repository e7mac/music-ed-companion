import React from 'react';

export default function ExamplePlayer(props) {
	return (
    <>
        <p>
          <midi-player
            src={props.item.midi}
            sound-font="https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus"
          />
        </p>
        <p>
          <img src={props.item.image} alt="Musical example"/>
        </p>
    </>
  );
}
