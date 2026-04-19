import React from 'react';
import { useParams } from 'react-router-dom';

const QR = () => {
  const { tableId } = useParams();

  return (
    <div>
      <h1>QR Page</h1>
      <p>Table ID: {tableId}</p>
    </div>
  );
};

export default QR;
