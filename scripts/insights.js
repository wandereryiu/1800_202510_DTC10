var xValues = ["Eating Out", "Shopping", "Groceries", "Entertainment", "Transportation", "Bills", "Other"];
var yValues = [55, 49, 44, 24, 15, 24, 27];
var barColors = [
  "#b91d47",
  "#00aba9",
  "#2b5797",
  "#e8c3b9",
  "#ffff66",
  "#339966",
  "#ff9933"
];

new Chart("myChart", {
  type: "pie",
  data: {
    labels: xValues,
    datasets: [{
      backgroundColor: barColors,
      data: yValues
    }]
  },
  options: {
    title: {
      display: true,
      text: "Insights"
    }
  }
});