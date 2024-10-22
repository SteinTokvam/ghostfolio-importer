export async function uploadActivities(activities: any) {
  return await fetch("http://localhost:3333/api/v1/import", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE4OGJhY2VhLWYxMTItNDQ1YS05YmFhLTc1NmFlNDkzYWY3ZCIsImlhdCI6MTcyOTUxNjUzOSwiZXhwIjoxNzQ1MDY4NTM5fQ.nSLqREVdk9OPwis666uFuVEWpU0j6dl-xb_WfigF1Gg"}`,
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
