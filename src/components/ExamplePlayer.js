import React from 'react';

export default function ExamplePlayer(props) {
  console.log(props.baseUrl + props.item.midi)
	return (
    <>
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
