"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "@/components/ui/badge";

const WebhookEventsList = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch(`${url}api/webhook/events`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  console.log(events);
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Webhook Events</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Type</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event._id}>
                <TableCell>{event.eventType}</TableCell>
                <TableCell>{event.branchName || event.branch}</TableCell>
                <TableCell>
                  {event.eventType === "push" ? (
                    <ul className="list-disc pl-4">
                      {event.commitMessages?.map((commit, index) => (
                        <li key={index} className="text-sm">
                          {commit.message} by {commit.author}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-medium">
                        {event.PullRequest?.title || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {event.PullRequest?.author || "N/A"}
                      </p>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {event.eventType === "pull_request" &&
                  event.PullRequest?.status ? (
                    <Badge
                      variant={
                        event.PullRequest.status === "open"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {event.PullRequest.status}
                    </Badge>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default WebhookEventsList;
