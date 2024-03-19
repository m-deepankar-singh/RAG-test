import React from 'react';
import { Button } from '../components/ui/button';
import axios from 'axios';

const FileDelete: React.FC = () => {
  const handleDelete = async () => {
    try {
      await axios.delete('http://localhost:8000/api/delete');
      alert('Files deleted successfully');
    } catch (error) {
      console.error('Error deleting files:', error);
      alert('Error deleting files');
    }
  };

  return (
    <div>
      <Button onClick={handleDelete} className="mr-4 px-4 py-2" >Delete Context</Button>
    </div>
  );
};

export default FileDelete;