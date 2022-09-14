let chart = null;

function Append(p, ns, perfix, estimated) {
    chart.data.datasets[0].data.push(ns);
    chart.data.datasets[0].data.shift();
    console.log(chart.data.datasets[0].data)

    let parent = document.getElementById('myData')
    parent.children[0].innerHTML = 'PROGRESS: '+p+'%'
    parent.children[1].innerHTML = 'NET SPEED: '+ns+' ' + perfix
    parent.children[2].innerHTML = 'ESTIMATED TIME: '+estimated+' Sec'

    chart.update(); //Update Char
}

$(window).ready(() => {
    var x = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50];
    var y = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

    chart = new Chart("myChart", {
        type: "line",
        data: {
            labels: x,
            datasets: [{
            fill: true,
            lineTension: 0,
            backgroundColor: "rgba(20, 135, 54,.5)",
            borderColor: "rgba(0,255,0,0.3)",
            data: y
            }]
        },
        options: {
            legend: {display: false},
            scales: {
                yAxes: [{gridLines:{ drawBorder:false,} ,ticks: {min: 0}}],
              }
        }
    });
})