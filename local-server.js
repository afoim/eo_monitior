import apiApp from './node-functions/api/[[default]].js';
import express from 'express';
import path from 'path';

const mainApp = express();

// Serve static files (frontend)
mainApp.use(express.static(path.resolve(process.cwd())));

// Mount the API app at /api
// The imported app defines routes like '/config', so mounting at '/api' makes them '/api/config'
mainApp.use('/api', apiApp);

// Start server
const PORT = 3000;
mainApp.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
