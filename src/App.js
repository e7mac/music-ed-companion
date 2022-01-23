import React, { useState, useEffect } from 'react';
import './App.css';
import BookPlayer from './components/BookPlayer.js';
import { Col, Container, Nav, Navbar, NavDropdown, Row } from 'react-bootstrap';
import unmute from './lib/unmute'

function App() {
	const [content, setContent] = useState(null)

  const getData = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const book = urlParams.get('book')
    fetch(
      `https://music-ed.s3.us-east-2.amazonaws.com/${book}.json` ,{
      headers : {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(function(response) {
      setContent(response);
    });
  }

  const books = [
    'Applied Counterpoint',
    'Contemporary Harmony',
    'Creative Orchestration',
    'Elementary Counterpoint',
    'Musical Composition Craft And Art',
    'Structural Functions Of Harmony',
    'Twentieth Century Harmony',
    'Modulation',
    'Brahms And The Principle Of Developing Variation',
    'The Shaping Forces In Music',
    'Fundamentals Of Musical Composition',
    'Japanese Music Harmony Vol1',
    'Latin Jazz Piano',
  ]

  useEffect(()=>{
    getData()
    let context = (window.AudioContext || window.webkitAudioContext)
    ? new (window.AudioContext || window.webkitAudioContext)()
    : null;
    // Pass it to unmute if the context exists... ie WebAudio is supported
    if (context) unmute(context);
  },[])

  return (
    <Container fluid>
      <Navbar bg="light" expand="lg">
        <Navbar.Brand href="#home">Music Ed</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <NavDropdown title="Books" id="basic-nav-dropdown">
              {
                books.map( book => {
                  return <NavDropdown.Item href={`?book=${book}`}>{book}</NavDropdown.Item>
                })
              }
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <Row class="text-center">
        <Col md="auto">
        {
          content
            ? <>
              <BookPlayer
                book={content}
              />
              </>
            : "Pick a book"
        }
        </Col>
      </Row>
    </Container>
  );
}

export default App;
