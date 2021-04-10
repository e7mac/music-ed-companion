import React, { useState, useEffect } from 'react';
import './App.css';
import BookPlayer from './components/BookPlayer.js';

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
          <BookPlayer
            book={content}
          />
          </>
        : "Loading..."
    }
    </div>
  );
}

export default App;
