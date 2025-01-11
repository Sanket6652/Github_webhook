const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
require("dotenv").config();
const app = express();
app.use(express.json());
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

// Models
const Event = mongoose.model(
  "Event",
  new mongoose.Schema({
    type: String,
    payload: Object,
    timestamp: Date,
  })
);

const Commit = mongoose.model(
  "Commit",
  new mongoose.Schema({
    branch: String,
    message: String,
    author: String,
    timestamp: Date,
  })
);

const PullRequest = mongoose.model(
  "PullRequest",
  new mongoose.Schema({
    pr_id: Number,
    title: String,
    branch: String,
    status: String,
    created_at: Date,
    merged_at: Date,
  })
);

// Verify webhook signature
// Middleware to validate GitHub signature
function validateGithubSignature(req, res, next) {
  const signature = req.headers["x-hub-signature-256"];
  const payload = JSON.stringify(req.body);
  const hmac = crypto.createHmac("sha256", process.env.GITHUB_SECRET);
  const digest = `sha256=${hmac.update(payload).digest("hex")}`;
  console.log(digest);

  if (signature !== digest) {
    return res.status(401).send("Invalid signature.");
  }

  next();
}

// Webhook Endpoint
app.post("/webhook/github", validateGithubSignature, async (req, res) => {
  const eventType = req.headers["x-github-event"];
  const payload = req.body;

  try {
    let eventDetails = { eventType };

    if (eventType === "push") {
      eventDetails = {
        ...eventDetails,
        branch: payload.ref.split("/").pop(),
        Commit: payload.commits.map((commit) => ({
          message: commit.message,
          author: commit.author ? commit.author.name : "Unknown", // Safe check
          timestamp: commit.timestamp || new Date(), // Use current timestamp if missing
        })),
      };
    } else if (eventType === "pull_request") {
      eventDetails = {
        ...eventDetails,
        branch: payload.pull_request.head.ref,
        PullRequest: {
          title: payload.pull_request.title,
          author: payload.pull_request.user.login,
          status: payload.pull_request.state,
          createdAt: payload.pull_request.created_at,
          mergedAt: payload.pull_request.merged_at,
        },
      };
    }

    // Save the event to MongoDB using Mongoose
    const event = new Event(eventDetails); // Use the correct model name
    await event.save();

    res.status(200).send(event);
  } catch (error) {
    console.error("Error processing webhook event:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/analytics/commits", async (req, res) => {
  try {
    const sevenDaysAgo = moment().subtract(7, "days").toDate();

    const commits = await Event.aggregate([
      {
        $match: {
          eventType: "push",
          "commits.timestamp": { $gte: sevenDaysAgo },
        },
      },
      { $unwind: "$commits" },
      { $group: { _id: "$branch", count: { $sum: 1 } } },
    ]);

    res.json(commits);
  } catch (error) {
    console.error("Error fetching commit analytics:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/analytics/contributor", async (req, res) => {
  try {
    const contributors = await Event.aggregate([
      { $match: { eventType: "push" } },
      { $unwind: "$commits" },
      { $group: { _id: "$commits.author", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    res.json(contributors[0]);
  } catch (error) {
    console.error("Error fetching contributor analytics:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/analytics/prs", async (req, res) => {
  try {
    const pullRequests = await Event.aggregate([
      {
        $match: {
          eventType: "pull_request",
          "pullRequest.status": "closed",
          "pullRequest.mergedAt": { $ne: null },
        },
      },
      {
        $project: {
          timeToMerge: {
            $subtract: [
              { $toDate: "$pullRequest.mergedAt" },
              { $toDate: "$pullRequest.createdAt" },
            ],
          },
        },
      },
      { $group: { _id: null, averageTime: { $avg: "$timeToMerge" } } },
    ]);

    res.json({ averageTimeToMerge: pullRequests[0]?.averageTime || 0 });
  } catch (error) {
    console.error("Error fetching PR analytics:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => console.log("Server is running on port 3000"));
