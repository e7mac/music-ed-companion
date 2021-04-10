import React, { useState, useEffect } from 'react';
import './App.css';
import BookPlayer from './components/BookPlayer.js';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

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
  useEffect(()=>{
    getData()
  },[])

  return (
    <Container fluid>
    <Row class="text-center">
    <Col md="auto">
    {
      content
        ? <>
          <BookPlayer
            book={content}
          />
          </>
        : "Loading..."
    }
    </Col>
    </Row>
    </Container>
  );
}

export default App;
