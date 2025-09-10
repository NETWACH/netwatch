// Requires Chart.js
async function getApproval() {
  const ctx = document.getElementById("approvalChart");
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ["Jan", "Feb", "Mar"],
      datasets: [{
        label: "Approval Rating",
        data: [40, 42, 45], // placeholder data
        borderColor: "rgba(0, 200, 255, 1)",
        backgroundColor: "rgba(0, 200, 255, 0.2)"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}
getApproval();
