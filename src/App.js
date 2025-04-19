import React, { useState, useEffect } from 'react';
import MapComponent from './MapComponent';
import icecastService from './icecastService';

function App() {
  const [listeners, setListeners] = useState([]);

  useEffect(() => {
    async function fetchListeners() {
      const data = await icecastService.getListeners();
      setListeners(data);
    }

    fetchListeners();
  }, []);

  return (
    <div>
      <MapComponent listeners={listeners} />
    </div>
  );
}

export default App;
