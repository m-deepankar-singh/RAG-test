import React from 'react';
import { Button } from '../components/ui/button';
import axios from 'axios';

const FileProcessing: React.FC = () => {
  const handleProcess = async () => {
    try {
      await axios.get('http://localhost:8000/api/process');
      alert('Files embedded successfully');
    } catch (error) {
      console.error('Error processing files:', error);
      alert('Error processing files');
    }
  };

  return (
    <div>
      <Button onClick={handleProcess}>Embed Files</Button>
    </div>
  );
};

export default FileProcessing;