import { toast } from 'react-toastify'

class FileService {
  constructor() {
    this.tableName = 'file'
    this.apperClient = null
    this.initializeClient()
  }

  initializeClient() {
    if (typeof window !== 'undefined' && window.ApperSDK) {
      const { ApperClient } = window.ApperSDK
      this.apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      })
    }
  }

  ensureClient() {
    if (!this.apperClient) {
      this.initializeClient()
    }
    if (!this.apperClient) {
      throw new Error('Apper client not initialized')
    }
  }

  // Fetch all files for the current user
  async fetchAllFiles(userId = null, limit = 20, offset = 0) {
    try {
      this.ensureClient()
      
      // All fields from the table schema
      const fields = [
        'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 
        'ModifiedOn', 'ModifiedBy', 'type', 'size', 'url', 
        'created_at', 'user_id'
      ]

      const params = {
        fields: fields,
        orderBy: [
          {
            fieldName: 'created_at',
            SortType: 'DESC'
          }
        ],
        pagingInfo: {
          limit: limit,
          offset: offset
        }
      }

      // Add user filter if userId is provided
      if (userId) {
        params.where = [
          {
            fieldName: 'user_id',
            operator: 'ExactMatch',
            values: [userId]
          }
        ]
      }

      const response = await this.apperClient.fetchRecords(this.tableName, params)
      
      if (!response || !response.data) {
        return []
      }

      return response.data
    } catch (error) {
      console.error('Error fetching files:', error)
      toast.error('Failed to load files')
      return []
    }
  }

  // Get a single file by ID
  async getFileById(fileId) {
    try {
      this.ensureClient()
      
      const fields = [
        'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 
        'ModifiedOn', 'ModifiedBy', 'type', 'size', 'url', 
        'created_at', 'user_id'
      ]

      const params = {
        fields: fields
      }

      const response = await this.apperClient.getRecordById(this.tableName, fileId, params)
      
      if (!response || !response.data) {
        return null
      }

      return response.data
    } catch (error) {
      console.error(`Error fetching file with ID ${fileId}:`, error)
      toast.error('Failed to load file details')
      return null
    }
  }

  // Create a new file record
  async createFile(fileData) {
    try {
      this.ensureClient()
      
      // Only include Updateable fields
      const updateableFields = {
        Name: fileData.name || fileData.Name,
        Tags: fileData.tags || fileData.Tags || '',
        Owner: fileData.owner || fileData.Owner || '',
        type: fileData.type,
        size: fileData.size,
        url: fileData.url,
        created_at: new Date().toISOString(),
        user_id: fileData.user_id || fileData.userId
      }

      const params = {
        records: [updateableFields]
      }

      const response = await this.apperClient.createRecord(this.tableName, params)
      
      if (response && response.success && response.results) {
        const successfulRecords = response.results.filter(result => result.success)
        const failedRecords = response.results.filter(result => !result.success)
        
        if (successfulRecords.length > 0) {
          toast.success('File uploaded successfully')
          return successfulRecords[0].data
        }
        
        if (failedRecords.length > 0) {
          const error = failedRecords[0].errors?.[0]?.message || 'Failed to create file record'
          toast.error(error)
          throw new Error(error)
        }
      }
      
      throw new Error('Failed to create file record')
    } catch (error) {
      console.error('Error creating file:', error)
      toast.error('Failed to save file information')
      throw error
    }
  }

  // Update an existing file record
  async updateFile(fileId, fileData) {
    try {
      this.ensureClient()
      
      // Only include Updateable fields plus ID
      const updateableFields = {
        Id: fileId
      }

      // Add only the fields that should be updated
      if (fileData.name || fileData.Name) updateableFields.Name = fileData.name || fileData.Name
      if (fileData.tags !== undefined || fileData.Tags !== undefined) updateableFields.Tags = fileData.tags || fileData.Tags || ''
      if (fileData.owner !== undefined || fileData.Owner !== undefined) updateableFields.Owner = fileData.owner || fileData.Owner || ''
      if (fileData.type !== undefined) updateableFields.type = fileData.type
      if (fileData.size !== undefined) updateableFields.size = fileData.size
      if (fileData.url !== undefined) updateableFields.url = fileData.url
      if (fileData.user_id !== undefined || fileData.userId !== undefined) updateableFields.user_id = fileData.user_id || fileData.userId

      const params = {
        records: [updateableFields]
      }

      const response = await this.apperClient.updateRecord(this.tableName, params)
      
      if (response && response.success && response.results) {
        const successfulUpdates = response.results.filter(result => result.success)
        const failedUpdates = response.results.filter(result => !result.success)
        
        if (successfulUpdates.length > 0) {
          toast.success('File updated successfully')
          return successfulUpdates[0].data
        }
        
        if (failedUpdates.length > 0) {
          const error = failedUpdates[0].message || 'Failed to update file'
          toast.error(error)
          throw new Error(error)
        }
      }
      
      throw new Error('Failed to update file')
    } catch (error) {
      console.error('Error updating file:', error)
      toast.error('Failed to update file')
      throw error
    }
  }

  // Delete a file record
  async deleteFile(fileId) {
    try {
      this.ensureClient()
      
      const params = {
        RecordIds: [fileId]
      }

      const response = await this.apperClient.deleteRecord(this.tableName, params)
      
      if (response && response.success && response.results) {
        const successfulDeletions = response.results.filter(result => result.success)
        const failedDeletions = response.results.filter(result => !result.success)
        
        if (successfulDeletions.length > 0) {
          toast.success('File deleted successfully')
          return true
        }
        
        if (failedDeletions.length > 0) {
          const error = failedDeletions[0].message || 'Failed to delete file'
          toast.error(error)
          throw new Error(error)
        }
      }
      
      throw new Error('Failed to delete file')
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Failed to delete file')
      throw error
    }
  }
}

// Export a singleton instance
export const fileService = new FileService()
export default fileService