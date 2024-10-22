export async function uploadActivities(activities: any, token: string) {
  return await fetch("https://ghostfol.io/api/v1/import", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ activities: activities }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("imported activities to ghostfolio:");
      console.table(data.activities);
      return data.activities;
    });
}
