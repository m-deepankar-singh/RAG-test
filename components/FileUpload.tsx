import React, { useState, useRef } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import axios from "axios";

interface FileUploadProps {
  onFileSelect: (selectedFiles: FileList | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && isValidFileType(files)) {
      const filesArray = Array.from(files);
      setSelectedFiles(filesArray);
      onFileSelect(files);
    } else {
      alert("Please select valid file types (.pdf, .csv, .txt, .docx)");
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && isValidFileType(files)) {
      const filesArray = Array.from(files);
      setSelectedFiles(filesArray);
      onFileSelect(files);
    } else {
      alert("Please select valid file types (.pdf, .csv, .txt, .docx)");
    }
  };

  const isValidFileType = (files: FileList) => {
    const validTypes = [
      "application/pdf",
      "text/csv",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    return Array.from(files).every((file) => validTypes.includes(file.type));
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setSelectedFiles([]);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (selectedFiles.length > 0) {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      try {
        await axios.post("http://localhost:8000/api/uploadFile", formData);
        alert("Files uploaded successfully");
        handleClear(event);
      } catch (error) {
        console.error("Error uploading files:", error);
        alert("Error uploading files");
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className="border-2 border-dashed border-gray-300 p-4 rounded-md cursor-pointer"
    >
      <Input
        type="file"
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: "none" }}
      />
      <div>Drag and drop files here or click to select files</div>
      <div>Allowed file types: .pdf, .csv, .txt, .docx</div>
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <p>Selected files:</p>
          <ul>
            {selectedFiles.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
          <Button onClick={handleClear} className="mt-2">
            Clear
          </Button>
        </div>
      )}
      <Button onClick={handleUpload} className="mt-4">
        Upload
      </Button>
    </div>
  );
};

export default FileUpload;
