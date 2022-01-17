import React from 'react';
import { Button } from 'react-bootstrap';

export default class ExamplePlayer extends React.Component {
  constructor(props) {
    super(props)
    this.midiRef = React.createRef()
    this.state = {
      tempo: 1
    }
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

  decreaseTempo = () => {
    var tempo = this.state.tempo;
    tempo = Math.max(0.1, tempo - 0.1);
    this.setState({
      tempo: tempo
    })
  }

  increaseTempo = () => {
    var tempo = this.state.tempo;
    tempo = Math.min(5.0, tempo + 0.1);
    this.setState({
      tempo: tempo
    })
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
            {this.props.item.midi
              ? <midi-player
                  ref={this.midiRef}
                  src={this.props.baseUrl + this.props.item.midi}
                  sound-font="https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus"
                />
              : ""
            }
            {this.props.item.mp3
              ? <audio 
                  src={this.props.baseUrl + this.props.item.mp3}                   
                  controls
                />
              : ""
            }
          </p>
          <p>
            Tempo:
            <Button onClick={this.decreaseTempo} variant="light">-</Button>
            {this.state.tempo.toFixed(1)}x
            <Button onClick={this.increaseTempo} variant="light">+</Button>
            (Feature is a WIP)
          </p>
          <p>
            <img src={this.props.baseUrl + this.props.item.image} alt="Musical example"/>
          </p>
      </>
    );
  }
}
