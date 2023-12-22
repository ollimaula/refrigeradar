socket = io();

socket.on('update', () => {
    // Reloads data on socket update event.
    init();
});

function init() 
{
    document.getElementById('current_time').innerHTML = ''
    document.getElementById('current_humidity').innerHTML = ''
    document.getElementById('current_pressure').innerHTML = ''
    document.getElementById('current_temperature').innerHTML = 'Loading data, wait...'
    load_data()
}

async function load_data()
{
    let response = await fetch('/data')
    let payloads = await response.json()
    show_payloads(payloads)
}

function show_payloads(payloads) 
{
    let payloads_list = document.getElementById('payloads_list')
    let current_temperature = document.getElementById('current_temperature')

    if (payloads.length === 0) current_temperature.innerHTML = 'No data'
    else 
    {

        payloads_list.innerHTML = '';

        let payloads_history = payloads.slice(-7, -1); // Last hour of data, excluding current datapoint.
        var history_array = [];

        // Iterate through an hour of data, creating an array of li elements and finally populate a ul element with array contents.

        for (let i = 0; i < payloads_history.length; i++) 
        {

            var door_status = 0;

            if ( i != 0 && payloads_history[i].movementCounter > payloads_history[i-1].movementCounter) 
            {
                // Movement counter rises if the fridge door is opened.
                door_status = 1;
            }

            let li = create_payload_list_item(payloads_history[i], door_status)        
            history_array.push(li)
        
        }

        history_array.reverse().forEach(li => payloads_list.appendChild(li))

        // History needed to be iterated through twice for door_status check to function properly.
        // Reversal needed to be done after the check, otherwise the reversal breaks the functionality by placing the alert on the wrong timestamp.

        create_current(payloads.at(-1), payloads.at(-2))

        draw_charts(payloads)

    }

}

function create_payload_list_item(payload, door_status)
{

    let li = document.createElement('li')

    let li_attr = document.createAttribute('id')
    li_attr.value = payload._id
    li.setAttributeNode(li_attr)

    let time = document.createTextNode(`${time_converted(payload.time)}`)
    li.appendChild(time)

    let br = document.createElement('br')
    li.appendChild(br)

    let temperature = document.createTextNode(`${payload.temperature.toFixed(2)}°C `)
    li.appendChild(temperature)

    let humidity = document.createTextNode(` | ${payload.humidity.toFixed(2)}% `)
    li.appendChild(humidity)

    let pressure_converted = (payload.pressure*.01).toFixed(2) // Converting the raw data to hPa.
    let pressure = document.createTextNode(` | ${pressure_converted} hPa`)
    li.appendChild(pressure)

    let br2 = document.createElement('br')
    li.appendChild(br2)

    if (door_status == 1)
    {
        let span = document.createElement('span')
        span.style.color = "var(--alt)"
        let door_alert = document.createTextNode("Someone's been to the fridge!!!")
        span.appendChild(door_alert)
        li.appendChild(span)
    }
    else 
    {
        let door_alert = document.createTextNode("Door not opened")
        li.appendChild(door_alert)
    }

    return li

}

function create_current(payload, door_check) 
{
    var door_status = 0;

    if (payload.movementCounter > door_check.movementCounter)
    {
        // Movement counter rises if the fridge door is opened.
        door_status = 1;
    };

    let current_temperature = document.getElementById('current_temperature')
    let current_humidity = document.getElementById('current_humidity')
    let current_pressure = document.getElementById('current_pressure')

    current_temperature.innerHTML = '';

    let current_time = document.getElementById('current_time');
    current_time.innerHTML = '';

    let temp_span = document.createElement('span')
    temp_span.classList.add("material-symbols-outlined") // Google icon
    temp_span.innerHTML = 'thermostat'
    let temperature = document.createElement('p')
    temperature.innerHTML = `${payload.temperature}°C`
    temp_span.appendChild(temperature)
    current_temperature.appendChild(temp_span)

    let hum_span = document.createElement('span')
    hum_span.classList.add("material-symbols-outlined") // Google icon
    hum_span.innerHTML = 'humidity_percentage'
    let humidity = document.createElement('p')
    humidity.innerHTML = `${payload.humidity}%`
    hum_span.appendChild(humidity)
    current_humidity.appendChild(hum_span)

    let pressure_span = document.createElement('span')
    pressure_span.classList.add("material-symbols-outlined") // Google icon
    pressure_span.innerHTML = 'speed'
    let pressure_converted = (payload.pressure*.01).toFixed(2)
    let pressure = document.createElement('p')
    pressure.innerHTML = `${pressure_converted} hPa`
    pressure_span.appendChild(pressure)
    current_pressure.appendChild(pressure_span)

    let time = document.createTextNode(`${time_converted(payload.time)} | `)
    current_time.appendChild(time)

    if (door_status == 1)
    {
        let span = document.createElement('span')
        span.style.color = "var(--alt)"
        let door_alert = document.createTextNode("Someone's been to the fridge!!!")
        span.appendChild(door_alert)
        current_time.append(span)
    } 
    else current_time.append(document.createTextNode('Door not opened'))

}

function draw_charts(payloads) // Drawing chart.js charts.
{

    const options = {
        legend: {
            display: false
        },
        interaction: {
            mode: 'index'
        },
        scales: {
            xAxes: [{
                ticks: {
                    display: false
                }
            }]
        }
    };

    let temperatures = [];
    let pressures = [];
    let humidities = [];
    let times = [];
    
    payloads.forEach(payload => {
        temperatures.push(payload.temperature)
        pressures.push(payload.pressure * .01)
        humidities.push(payload.humidity)
        times.push(time_converted(payload.time))     
    });

    const tc_id = document.getElementById('temperature_chart').getContext('2d');
    window.temperature_chart = new Chart(tc_id, {
        type: 'line',
        data: {
            labels: times,
            datasets: [{
                data: temperatures,
                backgroundColor: '#ff66cc',
                pointRadius: 0
            }]
        },
        options: options
    });

    const hc_id = document.getElementById('humidity_chart').getContext('2d');
    window.humidity_chart = new Chart(hc_id, {
        type: 'line',
        data: {
            labels: times,
            datasets: [{
                label: 'Humidity',
                data: humidities,
                backgroundColor: '#ff66cc',
                pointRadius: 0
            }]
        },
        options: options
    });

    const pc_id = document.getElementById('pressure_chart').getContext('2d');
    window.pressure_chart = new Chart(pc_id, {
        type: 'line',
        data: {
            labels: times,
            datasets: [{
                label: 'Pressure',
                data: pressures,
                backgroundColor: '#ff66cc',
                pointRadius: 0
            }]
        },
        options: options
    });
    
}

function time_converted(time) 
{

    let rawtime = new Date(time).toLocaleString("fi-FI", {timeZone: 'Europe/Helsinki', hour12: false, hourCycle: 'h23'})
    rawtime = rawtime.split(" ")

    if ( (rawtime[1])[1] == ('.') ) // Check for a missing 0 at the start of the string.
    {
        rawtime[1] = "0" + rawtime[1] // There's probably a method for this in Date, but I couldn't find it. This seems to work fine.
    }

    let timestamp = `${rawtime[0].split(".").join("/")} | ${rawtime[1].slice(0, 5).split(".").join(":")}`

    return timestamp;

}

function info(cmd) // info modal
{
    const modal = document.querySelector(".modal");
    const overlay = document.querySelector(".overlay");

    if (cmd == 1) 
    {
        modal.classList.remove("hidden");
        overlay.classList.remove("hidden");
    }
    else 
    {
        modal.classList.add("hidden");
        overlay.classList.add("hidden");
    }
}

function auto_update()
{
    const button = document.getElementById('update_button')
    const pop_up = document.getElementById('auto_info_pop_up')
    const renew = document.getElementById('renew')

    if (button.value == 0) 
    {   
        renew.style.color = 'var(--alt)'
        pop_up.innerHTML = ''
        pop_up.classList.remove("hidden")
        let text = document.createElement('p')
        text.innerHTML = 'Automatic updates enabled!'
        pop_up.appendChild(text)
        setTimeout(() => pop_up.classList.add("hidden"), 3000) // Hide the popup after 3 seconds.
        button.value = 1; // Toggle value.
        socket.emit('auto_start')
    }
    else 
    {
        renew.style.color = 'var(--text)'
        pop_up.innerHTML = ''
        pop_up.classList.remove("hidden")
        let text = document.createElement('p')
        text.innerHTML = 'Automatic updates disabled!'
        pop_up.appendChild(text)
        setTimeout(() => pop_up.classList.add("hidden"), 3000) // Hide the popup after 3 seconds.
        button.value = 0; // Toggle value.
        socket.emit('auto_stop')
    } 
}