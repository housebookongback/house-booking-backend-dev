const { startCleanupJob } = require('./jobs/cleanupJob');

// Initialize cleanup job
startCleanupJob();

// After all middleware setup but before routes registration
// Add middleware to handle /api prefix
app.use('/api', (req, res, next) => {
  // Remove /api prefix from the url
  req.url = req.url.replace(/^\/api/, '');
  // Continue to the next middleware
  next();
});

// At the end of all route registrations, before module.exports
// Add a test endpoint
app.get('/api-test', (req, res) => {
  res.json({ success: true, message: 'Backend API is running correctly' });
});

// Log all registered routes for debugging
console.log('=== REGISTERED ROUTES ===');
function printRoutes(stack, basePath = '') {
  stack.forEach(function(layer) {
    if (layer.route) {
      const path = basePath + layer.route.path;
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(', ');
      console.log(`${methods} ${path}`);
    } else if (layer.name === 'router' && layer.handle.stack) {
      // It's a router middleware
      let path = basePath;
      if (layer.regexp && layer.regexp.source !== '^\\/?$') {
        // Extract the router path from the regexp
        const match = layer.regexp.toString().match(/^\/\^\\\/([^\\\/]*)/);
        if (match) {
          path = basePath + '/' + match[1];
        }
      }
      printRoutes(layer.handle.stack, path);
    }
  });
}

try {
  printRoutes(app._router.stack);
  console.log('=========================');
} catch (err) {
  console.error('Error printing routes:', err);
}

module.exports = app; 