export default () => ({
  uploads: {
    appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT || 4043}`,
    storageDir: process.env.UPLOADS_STORAGE_DIR || 'storage/uploads',
    trashDir: process.env.UPLOADS_TRASH_DIR || 'storage/trash',
  },
});
