import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db, storage } from './config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc,
  updateDoc,
  orderBy 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

// Create context
const FirebaseContext = createContext(null);

// Hook to use the Firebase context
export const useFirebase = () => useContext(FirebaseContext);

// Provider component
export const FirebaseProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Authentication functions
  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // File storage functions
  const uploadFile = (file, progressCallback) => {
    return new Promise((resolve, reject) => {
      if (!user) {
        reject(new Error('User not authenticated'));
        return;
      }

      const storageRef = ref(storage, `files/${user.uid}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (progressCallback) progressCallback(progress);
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Save file metadata to Firestore
            const fileData = {
              name: file.name,
              type: file.type,
              size: file.size,
              url: downloadURL,
              createdAt: new Date(),
              userId: user.uid
            };
            
            const docRef = await addDoc(collection(db, 'files'), fileData);
            resolve({
              id: docRef.id,
              ...fileData
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  };

  const getFiles = async () => {
    if (!user) return [];
    
    try {
      const q = query(
        collection(db, 'files'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const files = [];
      
      querySnapshot.forEach((doc) => {
        files.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        });
      });
      
      return files;
    } catch (error) {
      console.error('Error getting files:', error);
      return [];
    }
  };

  const deleteFile = async (fileId, filePath) => {
    if (!user) return;
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'files', fileId));
      
      // Delete from Storage if path is provided
      if (filePath) {
        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    uploadFile,
    getFiles,
    deleteFile
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};