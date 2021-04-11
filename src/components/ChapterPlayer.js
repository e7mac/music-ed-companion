import React from 'react';
import ExamplePlayer from './ExamplePlayer.js';
import { Button } from 'react-bootstrap';

export default class ChapterPlayer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      index: 0
    }
  }

  componentDidMount() {
    window.addEventListener("keydown", this.handleKeyPress);
  }

  componentDidUnmount() {
    window.removeEventListener("keydown", this.handleKeyPress);
  }

  selectPreviousItem = () => {
    if (this.state.index > 0) {
      this.setState({
        index:this.state.index - 1
      })
    }
  }

  selectNextItem = () => {
    if (this.state.index + 1 < this.props.chapter.examples.length) {
      this.setState({
        index:this.state.index + 1
      })
    }
  }

  handleKeyPress = (e) => {
    if (e.key==="ArrowLeft") {
      this.selectPreviousItem()
    } else if (e.key==="ArrowRight") {
      this.selectNextItem()
    } else if (e.key==="ArrowUp") {
      this.setState({
        index:0
      })
      this.props.next()
    } else if (e.key==="ArrowDown") {
      this.setState({
        index:0
      })
      this.props.prev()
    }
  }

  render() {
    return (
    <>
      <h3>
          <Button onClick={this.props.prev} variant="light">﹤</Button>
          {this.props.chapter.name}
          <Button onClick={this.props.next} variant="light">﹥</Button>
      </h3>
      <ExamplePlayer
        item={this.props.chapter.examples[this.state.index]}
        baseUrl={`${this.props.baseUrl}${this.props.chapter.name}/`}
        prev={this.selectPreviousItem}
        next={this.selectNextItem}
      />
    </>
  );
  }
}
