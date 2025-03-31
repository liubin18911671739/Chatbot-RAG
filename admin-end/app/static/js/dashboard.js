document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('usageChart').getContext('2d');
    const usageChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // To be populated with usage data
            datasets: [{
                label: '系统使用情况',
                data: [], // To be populated with usage data
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Fetch usage data from the server
    fetch('/admin/api/statistics')
        .then(response => response.json())
        .then(data => {
            usageChart.data.labels = data.labels; // Assuming data.labels is an array of labels
            usageChart.data.datasets[0].data = data.usage; // Assuming data.usage is an array of usage values
            usageChart.update();
        })
        .catch(error => console.error('Error fetching usage data:', error));
});