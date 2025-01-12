import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getAnalyticsData() {
  const [commitsPerBranch, mostActiveContributor, averageMergeTime] =
    await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}api/analytics/commits-per-branch`).then((res) => res.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}api/analytics/most-active-contributor`).then((res) =>
        res.json()
      ),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}api/analytics/average-merge-time`).then((res) => res.json()),
    ]);

  return { commitsPerBranch, mostActiveContributor, averageMergeTime };
}

export async function AnalyticsData() {
  const { commitsPerBranch, mostActiveContributor, averageMergeTime } =
    await getAnalyticsData();
  return (
    <div className="flex gap-4 ">
      <Card>
        <CardHeader>
          <CardTitle>Commits Per Branch (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {commitsPerBranch.map((branch) => (
              <li key={branch._id} className="flex justify-between">
                <span>{branch._id}:</span>
                <span className="font-semibold">
                  {branch.commitCount} commits
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Most Active Contributor</CardTitle>
        </CardHeader>
        <CardContent>
          {mostActiveContributor ? (
            <p className="text-2xl font-bold">
              {mostActiveContributor._id}: {mostActiveContributor.commitCount}{" "}
              commits
            </p>
          ) : (
            <p>No contributors found.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average Merge Time</CardTitle>
        </CardHeader>
        <CardContent>
          {averageMergeTime ? (
            <p className="text-2xl font-bold">
              {averageMergeTime.averageMergeTimeInHours} hours
            </p>
          ) : (
            <p>No merged pull requests found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
