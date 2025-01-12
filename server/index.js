const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
require("dotenv").config();
const app = express();
const cors = require("cors");
const WebhookEvent = require("./models/webhookModel");
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook/github") {
    express.raw({ type: "application/json" })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

const moment = require("moment");
// MongoDB Connection
const port = process.env.PORT || 3000;
const mongoUrl = process.env.MONGO_URL;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

/// Middleware to parse JSON for all routes except /webhook/github
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook/github") {
    express.raw({ type: "application/json" })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

// Verify webhook signature
// Middleware to validate GitHub signature
function validateGithubSignature(req, res, next) {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) {
    return res.status(400).send("Missing signature.");
  }
  if (!req.body) {
    return res.status(400).send("Missing request body.");
  }

  const payload = req.body.toString("utf8");
  const secret = process.env.GITHUB_SECRET;

  if (!secret) {
    console.error("GITHUB_SECRET is not defined.");
    return res.status(500).send("Server configuration error.");
  }

  const hmac = crypto.createHmac("sha256", secret);
  const digest = `sha256=${hmac.update(payload).digest("hex")}`;

  if (signature !== digest) {
    console.log("Invalid signature:", signature, digest);
    return res.status(401).send("Invalid signature.");
  }

  next();
}

// Webhook Endpoint
app.post(
  "/webhook/github",
  express.raw({ type: "application/json" }),
  validateGithubSignature,
  async (req, res) => {
    const eventType = req.headers["x-github-event"];
    let payload;
    try {
      payload = JSON.parse(req.body.toString("utf8"));
    } catch (err) {
      console.error("Error parsing JSON:", err);
      return res.status(400).send("Invalid JSON.");
    }
    try {
      let eventDetails = { eventType };

      if (eventType === "push") {
        const { ref, commits } = payload;
        const branchName = ref.split("/").pop();
        const commitMessages = commits.map((commit) => ({
          message: commit.message,
          author: commit.author ? commit.author.name : "Unknown",
          timestamp: commit.timestamp ? new Date(commit.timestamp) : new Date(),
        }));

        eventDetails.branchName = branchName;
        eventDetails.commitMessages = commitMessages;
      } else if (eventType === "pull_request") {
        eventDetails = {
          ...eventDetails,
          branch: payload.pull_request.head.ref,
          PullRequest: {
            title: payload.pull_request.title,
            author: payload.pull_request.user.login,
            status: payload.pull_request.state,
            createdAt: new Date(payload.pull_request.created_at),
            mergedAt: payload.pull_request.merged_at
              ? new Date(payload.pull_request.merged_at)
              : null,
          },
        };
      }

      // Save the event to MongoDB using Mongoose
      const event = new WebhookEvent(eventDetails);
      await event.save();
      console.log(event);
      res.status(200).send(event);
    } catch (error) {
      console.error("Error processing webhook event:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

//Analytics Endpoint: Number of commits per branch in the last 7 days
app.get("/api/analytics/commits-per-branch", async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const commitsData = await WebhookEvent.aggregate([
      { $match: { eventType: "push", createdAt: { $gte: sevenDaysAgo } } },
      { $unwind: "$commitMessages" },
      {
        $group: {
          _id: "$branchName",
          commitCount: { $sum: 1 },
        },
      },
      { $sort: { commitCount: -1 } },
    ]);

    res.status(200).json(commitsData);
  } catch (error) {
    console.error("Error fetching commits per branch:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Fetch all webhook events
app.get("/api/webhook/events", async (req, res) => {
  try {
    const events = await WebhookEvent.find().sort({ createdAt: -1 });
    console.log(events);
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching webhook events:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Analytics Endpoint: Most active contributor based on commit frequency
app.get("/api/analytics/most-active-contributor", async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const contributorsData = await WebhookEvent.aggregate([
      { $match: { eventType: "push", createdAt: { $gte: sevenDaysAgo } } },
      { $unwind: "$commitMessages" },
      {
        $group: {
          _id: "$commitMessages.author",
          commitCount: { $sum: 1 },
        },
      },
      { $sort: { commitCount: -1 } },
      { $limit: 1 },
    ]);

    if (contributorsData.length === 0) {
      return res
        .status(200)
        .json({ message: "No contributors found in the last 7 days." });
    }

    res.status(200).json(contributorsData[0]);
  } catch (error) {
    console.error("Error fetching most active contributor:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Analytics Endpoint: Average time taken to merge pull requests
app.get("/api/analytics/average-merge-time", async (req, res) => {
  try {
    const mergedPRs = await WebhookEvent.find({
      eventType: "pull_request",
      "PullRequest.mergedAt": { $ne: null },
    });

    if (mergedPRs.length === 0) {
      return res
        .status(200)
        .json({ averageMergeTime: "No merged pull requests found." });
    }

    let totalTime = 0;
    mergedPRs.forEach((pr) => {
      const { createdAt, mergedAt } = pr.PullRequest;
      const timeTaken = mergedAt - createdAt; // milliseconds
      totalTime += timeTaken;
    });

    const averageTimeInMs = totalTime / mergedPRs.length;
    const averageTimeInHours = averageTimeInMs / (1000 * 60 * 60);

    res
      .status(200)
      .json({ averageMergeTimeInHours: averageTimeInHours.toFixed(2) });
  } catch (error) {
    console.error("Error calculating average merge time:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => console.log("Server is running on port 3000"));
