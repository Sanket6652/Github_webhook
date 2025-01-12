const mongoose = require('mongoose');

const commitSchema = new mongoose.Schema({
  message: String,
  author: String,
  timestamp: Date,
});

const pullRequestSchema = new mongoose.Schema({
  title: String,
  author: String,
  status: String,
  createdAt: Date,
  mergedAt: Date,
});

const webhookEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
  },
  branchName: String,
  commitMessages: [commitSchema],
  PullRequest: pullRequestSchema,
  branch: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);