import React, { useState, useEffect } from 'react';
import './App.css';
import ChapterPlayer from './components/ChapterPlayer.js';

function App() {
	const [content, setContent] = useState(null)

  const getData = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const book = urlParams.get('book')
    fetch(book ,{
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
    <div className="App">
    {
      content
        ? <>
            <h1>{content.name}</h1>
            <ChapterPlayer
              examples={content.chapters[0]}
            />
          </>
        : "Loading..."
    }
    </div>
  );
}

export default App;
