const express = require("express");
const app = express();

// Enable CORS for all routes with proper configuration
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://your-static-app.azurestaticapps.net", // Replace with your actual static app URL
    "https://your-app-service.azurewebsites.net", // Replace with your actual app service URL
  ];

  const origin = req.headers.origin;

  // Set CORS headers only for allowed origins
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.static(__dirname + "/client"));

const port = process.env.PORT || 3000;

// Wake up endpoint - to keep Azure App Service warm
app.get("/api/wakeup", function (request, response) {
  try {
    response.json({
      status: "success",
      server: "awake",
      timestamp: new Date().toISOString(),
      message: "Node.js server is running and ready",
      port: port,
    });
  } catch (error) {
    response.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Health check endpoint
app.get("/api/health", function (request, response) {
  try {
    response.json({
      status: "healthy",
      server: "Node.js Express on Azure",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    response.status(500).json({
      status: "error",
      message: "Health check failed",
      error: error.message,
    });
  }
});

// Dice roller API endpoints
app.get("/api/roll/single", function (request, response) {
  try {
    const result = Math.floor(Math.random() * 6) + 1;
    response.json({
      status: "success",
      die: "d6",
      result: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    response.status(500).json({
      status: "error",
      message: "Failed to roll dice",
      error: error.message,
    });
  }
});

app.get("/api/roll/multiple/:count", function (request, response) {
  try {
    const count = parseInt(request.params.count);

    // Input validation
    if (isNaN(count) || count < 1 || count > 100) {
      return response.status(400).json({
        status: "error",
        message: "Invalid count parameter. Must be a number between 1 and 100.",
      });
    }

    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(Math.floor(Math.random() * 6) + 1);
    }

    const total = results.reduce((sum, val) => sum + val, 0);

    response.json({
      status: "success",
      dice: "d6",
      count: count,
      results: results,
      total: total,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    response.status(500).json({
      status: "error",
      message: "Failed to roll dice",
      error: error.message,
    });
  }
});

// CORS failure demonstration endpoint - INTENTIONALLY no CORS headers
app.get("/api/roll-dice", function (request, response) {
  try {
    const result = Math.floor(Math.random() * 6) + 1;

    // Intentionally NOT setting CORS headers to demonstrate failure
    // Don't set any CORS headers for this endpoint
    response.json({
      status: "success",
      die: "d6",
      result: result,
      message:
        "This endpoint intentionally causes CORS errors when called from browser",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    response.status(500).json({
      status: "error",
      message: "Failed to roll dice",
      error: error.message,
    });
  }
});

// Original test endpoint
app.get("/test", function (request, response) {
  response.type("text/plain");
  response.send("Node.js and Express running on port=" + port);
});

// 404 handler for undefined routes
app.use("*", function (request, response) {
  response.status(404).json({
    status: "error",
    message: "Route not found",
    availableEndpoints: [
      "GET /api/wakeup",
      "GET /api/health",
      "GET /api/roll/single",
      "GET /api/roll/multiple/:count",
      "GET /api/roll-dice",
      "GET /test",
    ],
  });
});

// Error handling middleware
app.use(function (error, request, response, next) {
  console.error("Server error:", error);
  response.status(500).json({
    status: "error",
    message: "Internal server error",
    error: process.env.NODE_ENV === "production" ? {} : error.message,
  });
});

app.listen(port, function () {
  console.log(`🎲 Dice Roller API Server started`);
  console.log(`📍 Server is running at http://localhost:${port}/`);
  console.log("📋 Available API endpoints:");
  console.log("   GET /api/wakeup");
  console.log("   GET /api/health");
  console.log("   GET /api/roll/single");
  console.log("   GET /api/roll/multiple/:count");
  console.log("   GET /api/roll-dice (CORS demo)");
  console.log("   GET /test");
});
