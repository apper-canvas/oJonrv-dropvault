import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trash2, ExternalLink, FileText, Image, File, LogOut } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { useContext } from 'react'
import { AuthContext } from '../App'
import MainFeature from '../components/MainFeature'
import { fileService } from '../services/fileService'
import { format } from 'date-fns'

const Home = () => {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useSelector((state) => state.user)
  const { logout } = useContext(AuthContext)
  
// Load files from Apper backend on component mount
  useEffect(() => {
    const loadFiles = async () => {
      setLoading(true)
      try {
        const files = await fileService.fetchAllFiles(user?.userId)
        setUploadedFiles(files || [])
      } catch (error) {
        console.error('Error loading files:', error)
        setUploadedFiles([])
      } finally {
        setLoading(false)
      }
    }
    
    if (user?.userId) {
      loadFiles()
    }
  }, [user?.userId])
  
  const handleFileUpload = (files) => {
    setUploadedFiles(prev => [...files, ...prev]);
  };
  
const handleDeleteFile = async (fileId) => {
    try {
      await fileService.deleteFile(fileId)
      setUploadedFiles(prev => prev.filter(file => file.Id !== fileId))
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

return (
    <div className="max-w-5xl mx-auto">
      {/* Header with user info and logout */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-800 dark:text-surface-100">
            Welcome, {user?.firstName || user?.name || 'User'}
          </h1>
          <p className="text-surface-600 dark:text-surface-400">
            {user?.emailAddress || user?.email}
          </p>
        </div>
        <button
          onClick={logout}
          className="flex items-center space-x-2 px-4 py-2 bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Secure File Management
        </h2>
        <p className="text-lg text-surface-600 dark:text-surface-300 max-w-2xl mx-auto">
          Upload, organize, and share your files with confidence. DropVault provides a secure and intuitive platform for all your file management needs.
        </p>
      </motion.div>

      <MainFeature onFileUpload={handleFileUpload} />
      
      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="loader h-8 w-8 border-4 border-t-primary rounded-full animate-spin" />
        </div>
      ) : uploadedFiles.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-semibold mb-4">Your Files</h2>
          <div className="card divide-y divide-surface-200 dark:divide-surface-700">
{uploadedFiles.map((file, index) => (
              <div 
                key={file.Id || `${file.Name}-${index}`} 
                className="flex items-center justify-between p-4 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {getFileIcon(file.type)}
                  </div>
                  <div>
                    <p className="font-medium truncate max-w-xs">{file.Name}</p>
                    <div className="flex text-sm text-surface-500 space-x-3">
                      <span>{formatFileSize(file.size)}</span>
                      {file.created_at && (
                        <span>Uploaded: {format(new Date(file.created_at), 'MMM d, yyyy')}</span>
                      )}
                      {file.Tags && (
                        <span className="text-secondary">Tags: {file.Tags}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {file.url && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-surface-500 hover:text-primary rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                      aria-label="Download file"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                  <button 
                    onClick={() => handleDeleteFile(file.Id)}
                    className="p-2 text-surface-500 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    aria-label="Delete file"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 text-center p-8 card"
        >
          <p className="text-surface-500 dark:text-surface-400">No files uploaded yet. Start by uploading your first file.</p>
        </motion.div>
      )}
</div>
  )
}

// Helper functions
const getFileIcon = (fileType) => {
  if (!fileType) return <File size={20} />;
  
  if (fileType.includes('image')) {
    return <Image size={20} />;
  } else if (fileType.includes('pdf')) {
    return <FileText size={20} />;
  } else {
    return <File size={20} />;
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default Home;