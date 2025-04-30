import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Check, AlertCircle, FileText, Image, File } from 'lucide-react';

const MainFeature = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileInputChange = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
    // Reset file input
    e.target.value = '';
  }, []);

  const processFiles = useCallback((newFiles) => {
    // Filter out files larger than 10MB
    const validFiles = newFiles.filter(file => file.size <= 10 * 1024 * 1024);
    const oversizedFiles = newFiles.filter(file => file.size > 10 * 1024 * 1024);
    
    // Add error messages for oversized files
    const newErrors = {};
    oversizedFiles.forEach(file => {
      newErrors[file.name] = 'File exceeds 10MB limit';
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
    }
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      
      // Initialize progress for each file
      const newProgress = {};
      validFiles.forEach(file => {
        newProgress[file.name] = 0;
      });
      setUploadProgress(prev => ({ ...prev, ...newProgress }));
      
      // Simulate upload for each file
      validFiles.forEach(file => {
        simulateFileUpload(file);
      });
    }
  }, []);

  const simulateFileUpload = useCallback((file) => {
    setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Simulate a small delay before marking as complete
        setTimeout(() => {
          setUploadStatus(prev => ({ ...prev, [file.name]: 'complete' }));
          
          // Add to parent component's uploaded files
          onFileUpload([file]);
        }, 500);
      }
      
      setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
    }, 300);
  }, [onFileUpload]);

  const removeFile = useCallback((fileName) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[fileName];
      return newStatus;
    });
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fileName];
      return newErrors;
    });
  }, []);

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <Image size={24} className="text-primary" />;
    } else if (file.type === 'application/pdf') {
      return <FileText size={24} className="text-red-500" />;
    } else {
      return <File size={24} className="text-secondary" />;
    }
  };

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div
          className={`
            relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300
            ${isDragging 
              ? 'border-primary bg-primary/5 dark:bg-primary/10' 
              : 'border-surface-300 dark:border-surface-600 hover:border-primary/50 dark:hover:border-primary/50'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileInputChange}
            multiple
          />
          
          <div className="flex flex-col items-center justify-center py-6 cursor-pointer">
            <motion.div
              animate={{ 
                y: isDragging ? -10 : 0,
                scale: isDragging ? 1.1 : 1
              }}
              className="w-16 h-16 mb-4 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center"
            >
              <Upload size={28} className="text-primary" />
            </motion.div>
            
            <h3 className="text-xl font-semibold mb-2">
              {isDragging ? 'Drop files here' : 'Upload your files'}
            </h3>
            
            <p className="text-surface-500 dark:text-surface-400 text-center max-w-md mb-4">
              Drag and drop your files here, or click to browse
            </p>
            
            <div className="text-xs text-surface-500 dark:text-surface-400">
              Maximum file size: 10MB
            </div>
          </div>
        </div>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {(files.length > 0 || Object.keys(errors).length > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card divide-y divide-surface-200 dark:divide-surface-700">
              {files.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 flex items-center"
                >
                  <div className="mr-3">
                    {getFileIcon(file)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium truncate pr-4">{file.name}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.name);
                        }}
                        className="p-1 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
                        aria-label="Remove file"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="text-xs text-surface-500 mb-2">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                    
                    <div className="relative h-2 w-full bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress[file.name] || 0}%` }}
                        className={`absolute top-0 left-0 h-full rounded-full ${
                          uploadStatus[file.name] === 'complete' 
                            ? 'bg-green-500' 
                            : 'bg-primary'
                        }`}
                      />
                    </div>
                    
                    <div className="mt-1 flex items-center text-xs">
                      {uploadStatus[file.name] === 'complete' ? (
                        <span className="text-green-500 flex items-center">
                          <Check size={14} className="mr-1" /> Upload complete
                        </span>
                      ) : (
                        <span className="text-primary">
                          {Math.round(uploadProgress[file.name] || 0)}% uploaded
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Error messages */}
              {Object.entries(errors).map(([fileName, errorMsg], index) => (
                <motion.div
                  key={`error-${fileName}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-4 flex items-center bg-red-50 dark:bg-red-900/20"
                >
                  <div className="mr-3 text-red-500">
                    <AlertCircle size={24} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-red-700 dark:text-red-400 truncate pr-4">{fileName}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(fileName);
                        }}
                        className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-800/50 text-red-500 transition-colors"
                        aria-label="Dismiss error"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="text-sm text-red-600 dark:text-red-400">
                      {errorMsg}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainFeature;