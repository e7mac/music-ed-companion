import React, { useState, useEffect } from 'react';

export default function ExamplePlayer(props) {
	return (
    <>
        <p>
          <img src={props.item.image}/>
        </p>
        <p>
          <midi-player
            src={props.item.midi}
            sound-font="https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus"
          />
        </p>
    </>
  );
}
