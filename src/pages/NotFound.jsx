import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

const NotFound = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        className="w-32 h-32 mb-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"
      >
        <span className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          404
        </span>
      </motion.div>
      
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Page Not Found</h1>
      
      <p className="text-surface-600 dark:text-surface-300 max-w-md mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      
      <Link 
        to="/"
        className="btn btn-primary flex items-center gap-2 neu-light"
      >
        <Home size={18} />
        <span>Back to Home</span>
      </Link>
    </motion.div>
  );
};

export default NotFound;