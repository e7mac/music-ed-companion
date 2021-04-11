import React from 'react';
import { Button } from 'react-bootstrap';

export default class ExamplePlayer extends React.Component {
  constructor(props) {
    super(props)
    this.midiRef = React.createRef()
  }

  componentDidMount() {
    window.addEventListener("keydown", this.handleKeyPress);
  }

  componentDidUnmount() {
    window.removeEventListener("keydown", this.handleKeyPress);
  }

  handleKeyPress = (e) => {
    if (e.key===" ") {
      const midi = this.midiRef.current
      midi.playing
      ? midi.stop()
      : midi.start()
    }
  }

  render() {
    return (
      <>
          <p>
            <Button onClick={this.props.prev} variant="light">﹤</Button>
            {this.props.item.name}
            <Button onClick={this.props.next} variant="light">﹥</Button>
          </p>
          <p>
            <midi-player
              ref={this.midiRef}
              src={this.props.baseUrl + this.props.item.midi}
              sound-font="https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus"
            />
          </p>
          <p>
            <img src={this.props.baseUrl + this.props.item.image} alt="Musical example"/>
          </p>
      </>
    );
  }
}
